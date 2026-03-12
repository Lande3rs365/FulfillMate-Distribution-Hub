import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Auth ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  // ── Parse request ──
  let body: {
    company_id: string;
    action: "test" | "fetch_orders";
    after?: string;        // ISO date for incremental sync
    page?: number;
    per_page?: number;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { company_id, action } = body;
  if (!company_id || !action) {
    return jsonResponse({ error: "company_id and action are required" }, 400);
  }

  // ── Verify membership ──
  const serviceClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: membership } = await serviceClient
    .from("user_companies")
    .select("id")
    .eq("user_id", userId)
    .eq("company_id", company_id)
    .maybeSingle();

  if (!membership) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  // ── Fetch WooCommerce credentials ──
  const { data: integration, error: intErr } = await serviceClient
    .from("woocommerce_integrations")
    .select("store_url, consumer_key, consumer_secret")
    .eq("company_id", company_id)
    .maybeSingle();

  if (intErr || !integration) {
    return jsonResponse({ error: "No WooCommerce integration configured" }, 404);
  }

  const { store_url, consumer_key, consumer_secret } = integration;
  const baseUrl = store_url.replace(/\/+$/, "");
  const authString = btoa(`${consumer_key}:${consumer_secret}`);

  try {
    if (action === "test") {
      // Lightweight test: fetch 1 order
      const url = `${baseUrl}/wp-json/wc/v3/orders?per_page=1`;
      const res = await fetch(url, {
        headers: { Authorization: `Basic ${authString}` },
      });
      if (!res.ok) {
        const text = await res.text();
        return jsonResponse(
          { error: `WooCommerce returned ${res.status}`, details: text.slice(0, 500) },
          502,
        );
      }
      const data = await res.json();
      return jsonResponse({ success: true, order_count: Array.isArray(data) ? data.length : 0 });
    }

    if (action === "fetch_orders") {
      const page = body.page || 1;
      const perPage = Math.min(body.per_page || 100, 100);
      const params = new URLSearchParams({
        per_page: String(perPage),
        page: String(page),
        orderby: "date",
        order: "desc",
      });
      if (body.after) {
        params.set("after", body.after);
      }

      const url = `${baseUrl}/wp-json/wc/v3/orders?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Basic ${authString}` },
      });
      if (!res.ok) {
        const text = await res.text();
        return jsonResponse(
          { error: `WooCommerce returned ${res.status}`, details: text.slice(0, 500) },
          502,
        );
      }

      const orders = await res.json();
      const totalPages = parseInt(res.headers.get("x-wp-totalpages") || "1", 10);
      const totalOrders = parseInt(res.headers.get("x-wp-total") || "0", 10);

      return jsonResponse({ orders, total_pages: totalPages, total_orders: totalOrders, page });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    return jsonResponse({ error: "Failed to reach WooCommerce store", details: err?.message }, 502);
  }
});
