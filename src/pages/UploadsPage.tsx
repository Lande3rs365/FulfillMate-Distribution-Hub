import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDataIntakeLogs } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { parseWooCommerceCSV, parseShipmentCSV, readFileAsText } from "@/lib/csvParsers";
import type { ParsedOrder, ParsedShipment } from "@/lib/csvParsers";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;

const sources = ['WooCommerce', 'Pirate Ship', 'ShipStation', 'Inventory / Stock', 'Manufacturer Inbound'];

interface UploadProgress {
  fileName: string;
  status: "parsing" | "importing" | "done" | "error";
  total: number;
  processed: number;
  errors: number;
  message?: string;
}

export default function UploadsPage() {
  const [selectedSource, setSelectedSource] = useState(sources[0]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<UploadProgress | null>(null);
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: logs = [], isLoading } = useDataIntakeLogs();

  const importWooCommerceOrders = useCallback(async (orders: ParsedOrder[], companyId: string): Promise<{ processed: number; errors: number }> => {
    let processed = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        // Upsert order by order_number + company_id
        const { data: existingOrder } = await db
          .from("orders")
          .select("id")
          .eq("company_id", companyId)
          .eq("order_number", order.order_number)
          .maybeSingle();

        let orderId: string;

        if (existingOrder) {
          // Update existing order
          await db.from("orders").update({
            order_date: order.order_date,
            status: order.status,
            woo_status: order.woo_status,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            shipping_address: order.shipping_address,
            total_amount: order.total_amount,
            currency: order.currency,
            source: order.source,
          }).eq("id", existingOrder.id);
          orderId = existingOrder.id;

          // Remove old line items to replace
          await db.from("order_items").delete().eq("order_id", orderId);
        } else {
          // Insert new order
          const { data: newOrder, error: orderErr } = await db.from("orders").insert({
            company_id: companyId,
            order_number: order.order_number,
            order_date: order.order_date,
            status: order.status,
            woo_status: order.woo_status,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            shipping_address: order.shipping_address,
            total_amount: order.total_amount,
            currency: order.currency,
            source: order.source,
          }).select("id").single();

          if (orderErr) throw orderErr;
          orderId = newOrder.id;
        }

        // Insert line items
        if (order.line_items.length > 0) {
          const items = order.line_items.map((li) => ({
            order_id: orderId,
            sku: li.sku,
            quantity: li.quantity,
            unit_price: li.unit_price,
            line_total: li.line_total,
          }));
          await db.from("order_items").insert(items);
        }

        processed++;
      } catch (err) {
        console.error(`Error importing order ${order.order_number}:`, err);
        errors++;
      }
    }

    return { processed, errors };
  }, []);

  const importShipments = useCallback(async (shipments: ParsedShipment[], companyId: string): Promise<{ processed: number; errors: number }> => {
    let processed = 0;
    let errors = 0;

    for (const shipment of shipments) {
      try {
        // Find the order by order_number
        const { data: order } = await db
          .from("orders")
          .select("id")
          .eq("company_id", companyId)
          .eq("order_number", shipment.order_number)
          .maybeSingle();

        if (!order) {
          // Create a stub order if it doesn't exist
          const { data: newOrder, error: oErr } = await db.from("orders").insert({
            company_id: companyId,
            order_number: shipment.order_number,
            order_date: shipment.order_date,
            status: shipment.woo_status ? shipment.woo_status : "processing",
            woo_status: shipment.woo_status || "processing",
            customer_name: shipment.customer_name,
            total_amount: shipment.order_total,
            source: "woocommerce",
          }).select("id").single();
          if (oErr) throw oErr;
          var orderId = newOrder.id;
        } else {
          var orderId = order.id;
        }

        // Check if shipment with same tracking number exists
        if (shipment.tracking_number) {
          const { data: existing } = await db
            .from("shipments")
            .select("id")
            .eq("company_id", companyId)
            .eq("order_id", orderId)
            .eq("tracking_number", shipment.tracking_number)
            .maybeSingle();

          if (existing) {
            // Update existing shipment
            await db.from("shipments").update({
              status: shipment.status,
              shipped_date: shipment.shipped_date,
              delivered_date: shipment.delivered_date,
              shipping_cost: shipment.shipping_cost,
              carrier: shipment.carrier,
            }).eq("id", existing.id);
            processed++;
            continue;
          }
        }

        // Insert new shipment
        await db.from("shipments").insert({
          company_id: companyId,
          order_id: orderId,
          tracking_number: shipment.tracking_number,
          carrier: shipment.carrier,
          status: shipment.status,
          shipped_date: shipment.shipped_date,
          delivered_date: shipment.delivered_date,
          shipping_cost: shipment.shipping_cost,
        });

        processed++;
      } catch (err) {
        console.error(`Error importing shipment for order ${shipment.order_number}:`, err);
        errors++;
      }
    }

    return { processed, errors };
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!currentCompany || !user) return;

    const sourceKey = selectedSource.toLowerCase().replace(/\s+\/?\s*/g, "_");
    
    setUploading({ fileName: file.name, status: "parsing", total: 0, processed: 0, errors: 0 });

    try {
      const text = await readFileAsText(file);
      let totalRows = 0;
      let result = { processed: 0, errors: 0 };

      if (selectedSource === "WooCommerce") {
        const orders = parseWooCommerceCSV(text);
        totalRows = orders.length;
        setUploading(prev => prev ? { ...prev, status: "importing", total: totalRows } : null);
        result = await importWooCommerceOrders(orders, currentCompany.id);
      } else if (selectedSource === "Pirate Ship" || selectedSource === "ShipStation") {
        const shipments = parseShipmentCSV(text);
        totalRows = shipments.length;
        setUploading(prev => prev ? { ...prev, status: "importing", total: totalRows } : null);
        result = await importShipments(shipments, currentCompany.id);
      } else {
        toast({ title: "Not supported yet", description: `Parsing for "${selectedSource}" is coming soon.`, variant: "destructive" });
        setUploading(null);
        return;
      }

      // Log the intake
      await db.from("data_intake_logs").insert({
        company_id: currentCompany.id,
        file_name: file.name,
        file_type: file.name.endsWith(".csv") ? "csv" : "xlsx",
        source_type: sourceKey,
        status: result.errors > 0 ? "completed_with_errors" : "completed",
        total_rows: totalRows,
        processed_rows: result.processed,
        error_rows: result.errors,
        uploaded_by: user.id,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      setUploading({ fileName: file.name, status: "done", total: totalRows, processed: result.processed, errors: result.errors });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["data_intake_logs"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });

      toast({
        title: "Import complete",
        description: `${result.processed} of ${totalRows} rows imported${result.errors > 0 ? ` (${result.errors} errors)` : ""}.`,
      });
    } catch (err: any) {
      console.error("File processing error:", err);
      setUploading(prev => prev ? { ...prev, status: "error", message: err.message } : null);
      toast({ title: "Import failed", description: err.message, variant: "destructive" });

      // Log the failure
      await db.from("data_intake_logs").insert({
        company_id: currentCompany.id,
        file_name: file.name,
        file_type: file.name.endsWith(".csv") ? "csv" : "xlsx",
        source_type: sourceKey,
        status: "failed",
        total_rows: 0,
        uploaded_by: user.id,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_details: { message: err.message },
      });
      queryClient.invalidateQueries({ queryKey: ["data_intake_logs"] });
    }

    // Clear progress after a moment
    setTimeout(() => setUploading(null), 4000);
  }, [currentCompany, selectedSource, user, queryClient, importWooCommerceOrders, importShipments]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFile(files[0]);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFile(files[0]);
  }, [processFile]);

  if (!currentCompany) return <EmptyState icon={Upload} title="No company selected" />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Intake</h1>
        <p className="text-sm text-muted-foreground">Upload order, shipment, inventory, and manufacturer inbound files</p>
      </div>

      {/* Source selector */}
      <div className="flex gap-2 flex-wrap">
        {sources.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSource(s)}
            disabled={!!uploading}
            className={cn(
              "px-4 py-2 rounded-md text-sm border transition-colors",
              s === selectedSource
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className={cn(
          "border rounded-lg p-4 flex items-center gap-3",
          uploading.status === "error" ? "border-destructive bg-destructive/5" :
          uploading.status === "done" ? "border-success bg-success/5" :
          "border-primary bg-primary/5"
        )}>
          {uploading.status === "parsing" || uploading.status === "importing" ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : uploading.status === "done" ? (
            <Check className="w-5 h-5 text-success" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{uploading.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {uploading.status === "parsing" && "Parsing CSV..."}
              {uploading.status === "importing" && `Importing ${uploading.total} rows...`}
              {uploading.status === "done" && `Done — ${uploading.processed} imported, ${uploading.errors} errors`}
              {uploading.status === "error" && (uploading.message || "Import failed")}
            </p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-foreground font-medium">Drop {selectedSource} files here</p>
        <p className="text-sm text-muted-foreground mt-1">CSV files supported</p>
        <label className={cn(
          "inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm cursor-pointer hover:bg-primary/90 transition-colors",
          uploading && "pointer-events-none"
        )}>
          Browse Files
          <input type="file" className="hidden" accept=".csv" onChange={handleFileSelect} />
        </label>
      </div>

      {/* Upload history */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-3">Recent Uploads</h2>
        {isLoading ? <LoadingSpinner message="Loading upload history..." /> : logs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No uploads yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-success" />
                  <div>
                    <p className="text-sm font-mono text-foreground">{u.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.source_type?.replace(/_/g, " ")} · {u.processed_rows}/{u.total_rows || 0} rows
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.status === "completed" ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : u.status === "failed" ? (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-warning" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
