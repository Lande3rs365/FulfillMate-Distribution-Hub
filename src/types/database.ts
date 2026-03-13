// Local type definitions for database tables

export interface Company {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  created_at: string;
}

export interface StockLocation {
  id: string;
  company_id: string;
  name: string;
  code: string;
  location_type: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  description: string | null;
  unit_cost: number | null;
  sale_price: number | null;
  weight_grams: number | null;
  reorder_point: number;
  reorder_qty: number;
  is_active: boolean;
  category: string | null;
  parent_product_id: string | null;
  row_type: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  order_number: string;
  source: string | null;
  status: string;
  woo_status: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  total_amount: number | null;
  currency: string;
  order_date: string | null;
  tawk_ticket_id: string | null;
  zendesk_ticket_id: string | null;
  last_customer_contact_at: string | null;
  customer_chase_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number | null;
  line_total: number | null;
}

export interface Shipment {
  id: string;
  company_id: string;
  order_id: string;
  shipment_number: string | null;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_date: string | null;
  delivered_date: string | null;
  weight_grams: number | null;
  shipping_cost: number | null;
  region: string | null;
  tracking_chase_sent_at: string | null;
  tracking_chase_count: number;
  created_at: string;
  updated_at: string;
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  order_item_id: string | null;
  product_id: string | null;
  quantity: number;
}

export interface ManufacturerManifest {
  id: string;
  company_id: string;
  manifest_number: string | null;
  manufacturer_name: string;
  status: string;
  expected_date: string | null;
  received_date: string | null;
  request_date: string | null;
  shipment_date: string | null;
  tracking_number: string | null;
  eta: string | null;
  location_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManufacturerManifestItem {
  id: string;
  manifest_id: string;
  product_id: string | null;
  sku: string | null;
  expected_qty: number;
  received_qty: number;
  damaged_qty: number;
  short_qty: number;
  status: string;
}

export interface Return {
  id: string;
  company_id: string;
  order_id: string | null;
  return_number: string | null;
  status: string;
  reason: string | null;
  condition: string | null;
  resolution: string | null;
  stock_outcome: string | null;
  outcome_location_id: string | null;
  refund_amount: number | null;
  return_qty: number;
  product_id: string | null;
  sku: string | null;
  initiated_date: string | null;
  received_date: string | null;
  resolved_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryRecord {
  id: string;
  company_id: string;
  product_id: string;
  location_id: string;
  on_hand: number;
  available: number;
  reserved: number;
  allocated: number;
  damaged: number;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  company_id: string;
  product_id: string;
  sku: string | null;
  direction: string;
  movement_type: string;
  quantity: number;
  from_location_id: string | null;
  to_location_id: string | null;
  linked_order_id: string | null;
  linked_shipment_id: string | null;
  linked_return_id: string | null;
  linked_manifest_id: string | null;
  reason_code: string | null;
  notes: string | null;
  performed_by: string | null;
  timestamp: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export interface Exception {
  id: string;
  company_id: string;
  exception_type: string;
  severity: string;
  status: string;
  title: string;
  description: string | null;
  reason: string | null;
  linked_order_id: string | null;
  linked_shipment_id: string | null;
  linked_manifest_id: string | null;
  linked_return_id: string | null;
  follow_up_due_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataIntakeLog {
  id: string;
  company_id: string;
  file_name: string;
  file_type: string | null;
  file_path: string | null;
  source_type: string | null;
  status: string;
  total_rows: number | null;
  processed_rows: number;
  error_rows: number;
  error_details: Record<string, unknown> | null;
  uploaded_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Join types for queries with relations
export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface ShipmentWithOrder extends Shipment {
  orders: Pick<Order, 'order_number' | 'customer_name'> | null;
}

export interface ManifestWithItems extends ManufacturerManifest {
  manufacturer_manifest_items: ManufacturerManifestItem[];
}

export interface InventoryWithRelations extends InventoryRecord {
  products: Pick<Product, 'sku' | 'name' | 'reorder_point'> | null;
  stock_locations: Pick<StockLocation, 'name' | 'code'> | null;
}

export interface StockMovementWithRelations extends StockMovement {
  products: Pick<Product, 'name'> | null;
  from_location: Pick<StockLocation, 'name' | 'code'> | null;
  to_location: Pick<StockLocation, 'name' | 'code'> | null;
}

// ============================================================
// AI Agent Communications Infrastructure
// ============================================================

export type CommsChannel = 'email' | 'tawk' | 'zendesk' | 'whatsapp';
export type CommsThreadStatus = 'open' | 'awaiting_reply' | 'resolved' | 'closed';
export type CommsParticipantType = 'customer' | 'carrier' | 'supplier' | 'team';
export type CommsDirection = 'inbound' | 'outbound';
export type CommsSenderType = 'customer' | 'carrier' | 'supplier' | 'agent_ai' | 'team' | 'system';
export type IncomingWebhookSource = 'shipping_email' | 'tawk' | 'zendesk' | 'carrier' | 'other';
export type AgentActionType =
  | 'tracking_chase'
  | 'tracking_extract'
  | 'customer_notify'
  | 'customer_chase'
  | 'ticket_match'
  | 'whatsapp_cob_summary'
  | 'whatsapp_urgent'
  | 'record_update'
  | 'exception_flag';
export type AgentActionStatus = 'pending' | 'completed' | 'failed' | 'skipped';
export type AgentTriggerSource = 'cron' | 'webhook' | 'manual';

export interface CommsThread {
  id: string;
  company_id: string;
  order_id: string | null;
  shipment_id: string | null;
  channel: CommsChannel;
  external_thread_id: string | null;
  subject: string | null;
  participant_type: CommsParticipantType | null;
  participant_name: string | null;
  participant_contact: string | null;
  status: CommsThreadStatus;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommsMessage {
  id: string;
  company_id: string;
  thread_id: string;
  direction: CommsDirection;
  sender_type: CommsSenderType;
  sender_name: string | null;
  sender_contact: string | null;
  body: string | null;
  raw_payload: Record<string, unknown> | null;
  extracted_data: Record<string, unknown> | null;
  processed_at: string | null;
  created_at: string;
}

export interface IncomingWebhook {
  id: string;
  company_id: string | null;
  source: IncomingWebhookSource;
  raw_payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  matched_order_id: string | null;
  matched_shipment_id: string | null;
  matched_thread_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AgentAction {
  id: string;
  company_id: string;
  action_type: AgentActionType;
  trigger_source: AgentTriggerSource;
  linked_order_id: string | null;
  linked_shipment_id: string | null;
  linked_thread_id: string | null;
  linked_webhook_id: string | null;
  status: AgentActionStatus;
  input_summary: string | null;
  output_summary: string | null;
  error_message: string | null;
  executed_at: string | null;
  created_at: string;
}

// Join types
export interface CommsThreadWithMessages extends CommsThread {
  comms_messages: CommsMessage[];
}

export interface AgentActionWithRelations extends AgentAction {
  orders: Pick<Order, 'order_number' | 'customer_name'> | null;
  shipments: Pick<Shipment, 'shipment_number' | 'tracking_number'> | null;
  comms_threads: Pick<CommsThread, 'channel' | 'subject' | 'status'> | null;
}
