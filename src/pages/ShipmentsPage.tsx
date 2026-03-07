import StatusBadge from "@/components/StatusBadge";
import { mockOrders } from "@/data/mockData";
import { Truck, Search } from "lucide-react";

export default function ShipmentsPage() {
  const shipments = mockOrders.filter(o => o.shipmentStatus !== 'not-shipped');

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Shipments</h1>
        <p className="text-sm text-muted-foreground">{shipments.length} active shipments</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-4">Order</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Carrier</th>
                <th className="text-left py-3 px-4">Tracking</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-primary">{s.orderId}</td>
                  <td className="py-3 px-4 text-foreground">{s.customerName}</td>
                  <td className="py-3 px-4 text-foreground">{s.shipmentCarrier || '—'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.trackingNumber || 'Pending'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.shipmentDate || '—'}</td>
                  <td className="py-3 px-4"><StatusBadge status={s.shipmentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
