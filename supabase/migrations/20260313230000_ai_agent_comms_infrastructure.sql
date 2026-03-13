-- ============================================================
-- AI Agent Communications Infrastructure
-- Supports: automated tracking chases, customer comms,
-- WhatsApp team updates, Tawk.to / Zendesk ticket matching,
-- and shipping@ inbox monitoring.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Extend existing tables
-- ------------------------------------------------------------

-- shipments: track chase activity and region for APAC filtering
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS tracking_chase_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_chase_count integer NOT NULL DEFAULT 0;

-- orders: link to helpdesk tickets and track customer contact cadence
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tawk_ticket_id text,
  ADD COLUMN IF NOT EXISTS zendesk_ticket_id text,
  ADD COLUMN IF NOT EXISTS last_customer_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_chase_count integer NOT NULL DEFAULT 0;


-- ------------------------------------------------------------
-- 2. comms_threads
-- One thread per conversation across any channel.
-- Linked to an order and/or shipment.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.comms_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,

  -- Which platform this thread lives on
  channel text NOT NULL CHECK (channel IN ('email', 'tawk', 'zendesk', 'whatsapp')),

  -- The ID of this thread in the external system (ticket ID, thread ID, etc.)
  external_thread_id text,

  -- Human-readable subject / topic
  subject text,

  -- Who is on the other end
  participant_type text CHECK (participant_type IN ('customer', 'carrier', 'supplier', 'team')),
  participant_name text,
  participant_contact text, -- email address, phone, or handle

  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'awaiting_reply', 'resolved', 'closed')),

  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comms_threads_company_id_idx ON public.comms_threads(company_id);
CREATE INDEX IF NOT EXISTS comms_threads_order_id_idx ON public.comms_threads(order_id);
CREATE INDEX IF NOT EXISTS comms_threads_shipment_id_idx ON public.comms_threads(shipment_id);
CREATE INDEX IF NOT EXISTS comms_threads_channel_status_idx ON public.comms_threads(channel, status);
CREATE INDEX IF NOT EXISTS comms_threads_external_thread_id_idx ON public.comms_threads(external_thread_id);

ALTER TABLE public.comms_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comms_threads_company_isolation" ON public.comms_threads
  FOR ALL USING (public.user_belongs_to_company(company_id));


-- ------------------------------------------------------------
-- 3. comms_messages
-- Individual messages within a thread.
-- Stores the raw payload and Claude's structured extraction.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.comms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES public.comms_threads(id) ON DELETE CASCADE,

  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Who sent this message
  sender_type text NOT NULL
    CHECK (sender_type IN ('customer', 'carrier', 'supplier', 'agent_ai', 'team', 'system')),
  sender_name text,
  sender_contact text,

  -- Message content
  body text,

  -- Raw payload from the webhook / API (email MIME, Tawk event, Zendesk payload, etc.)
  raw_payload jsonb,

  -- Structured data extracted by the AI agent
  -- e.g. { "tracking_number": "1Z999...", "order_ref": "WC-1234", "ticket_id": "TKT-99" }
  extracted_data jsonb,

  -- When the agent processed this message (null = not yet processed)
  processed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comms_messages_company_id_idx ON public.comms_messages(company_id);
CREATE INDEX IF NOT EXISTS comms_messages_thread_id_idx ON public.comms_messages(thread_id);
CREATE INDEX IF NOT EXISTS comms_messages_direction_idx ON public.comms_messages(direction);
CREATE INDEX IF NOT EXISTS comms_messages_processed_at_idx ON public.comms_messages(processed_at);

ALTER TABLE public.comms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comms_messages_company_isolation" ON public.comms_messages
  FOR ALL USING (public.user_belongs_to_company(company_id));


-- ------------------------------------------------------------
-- 4. incoming_webhooks
-- Raw log of every inbound event before processing.
-- Enables debugging, replay, and deduplication.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.incoming_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nullable until matched to a company
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,

  -- Where this came from
  source text NOT NULL
    CHECK (source IN ('shipping_email', 'tawk', 'zendesk', 'carrier', 'other')),

  -- The full raw payload (email headers+body, Tawk event JSON, etc.)
  raw_payload jsonb NOT NULL,

  -- Processing state
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,

  -- Matched records (populated after agent processing)
  matched_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  matched_shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  matched_thread_id uuid REFERENCES public.comms_threads(id) ON DELETE SET NULL,

  -- If processing failed, store the reason
  error_message text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incoming_webhooks_company_id_idx ON public.incoming_webhooks(company_id);
CREATE INDEX IF NOT EXISTS incoming_webhooks_source_idx ON public.incoming_webhooks(source);
CREATE INDEX IF NOT EXISTS incoming_webhooks_processed_idx ON public.incoming_webhooks(processed);
CREATE INDEX IF NOT EXISTS incoming_webhooks_created_at_idx ON public.incoming_webhooks(created_at);

-- No RLS: webhook receiver runs as service role before company is known.
-- company_id is populated during processing.


-- ------------------------------------------------------------
-- 5. agent_actions
-- Full audit trail of every action the AI agent takes.
-- One row per discrete action — send email, post WhatsApp, etc.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- What type of action this was
  action_type text NOT NULL CHECK (action_type IN (
    'tracking_chase',       -- Chased a carrier / supplier for tracking number
    'tracking_extract',     -- Extracted tracking number from inbound message
    'customer_notify',      -- Sent info/update to customer
    'customer_chase',       -- Chased a customer for a response
    'ticket_match',         -- Matched inbound message to a helpdesk ticket
    'whatsapp_cob_summary', -- Sent end-of-day WhatsApp summary to team
    'whatsapp_urgent',      -- Sent urgent stock/exception alert to team
    'record_update',        -- Updated a shipment, order, or exception record
    'exception_flag'        -- Created or updated an exception
  )),

  -- What triggered this action
  trigger_source text NOT NULL CHECK (trigger_source IN ('cron', 'webhook', 'manual')),

  -- Linked records (all optional)
  linked_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  linked_shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  linked_thread_id uuid REFERENCES public.comms_threads(id) ON DELETE SET NULL,
  linked_webhook_id uuid REFERENCES public.incoming_webhooks(id) ON DELETE SET NULL,

  -- Outcome
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'skipped')),

  -- Human-readable summaries for the audit log / UI
  input_summary text,   -- "Shipment SHP-042 has no tracking after 3 days"
  output_summary text,  -- "Chase email sent to supplier@example.com"
  error_message text,   -- Populated on failure

  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_actions_company_id_idx ON public.agent_actions(company_id);
CREATE INDEX IF NOT EXISTS agent_actions_action_type_idx ON public.agent_actions(action_type);
CREATE INDEX IF NOT EXISTS agent_actions_status_idx ON public.agent_actions(status);
CREATE INDEX IF NOT EXISTS agent_actions_linked_order_id_idx ON public.agent_actions(linked_order_id);
CREATE INDEX IF NOT EXISTS agent_actions_linked_shipment_id_idx ON public.agent_actions(linked_shipment_id);
CREATE INDEX IF NOT EXISTS agent_actions_created_at_idx ON public.agent_actions(created_at);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_actions_company_isolation" ON public.agent_actions
  FOR ALL USING (public.user_belongs_to_company(company_id));


-- ------------------------------------------------------------
-- 6. Auto-update updated_at triggers
-- ------------------------------------------------------------

CREATE TRIGGER set_comms_threads_updated_at
  BEFORE UPDATE ON public.comms_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
