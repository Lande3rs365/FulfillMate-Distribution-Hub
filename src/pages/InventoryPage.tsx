import StatusBadge from "@/components/StatusBadge";
import { mockInventory } from "@/data/mockData";
import { Warehouse, Search, AlertTriangle, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const filtered = mockInventory.filter(i =>
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.productName.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = mockInventory.reduce((s, i) => s + i.stockOnHand, 0);
  const lowCount = mockInventory.filter(i => i.status === 'low-stock').length;
  const outCount = mockInventory.filter(i => i.status === 'out-of-stock').length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Control</h1>
          <p className="text-sm text-muted-foreground">{mockInventory.length} SKUs tracked · Operational stock reality</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card before:bg-gradient-to-r before:from-success before:to-transparent">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Stock</p>
          <p className="text-xl font-bold font-mono text-foreground">{totalStock.toLocaleString()}</p>
        </div>
        <div className="kpi-card before:bg-gradient-to-r before:from-warning before:to-transparent">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-warning" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Low Stock</p>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">{lowCount}</p>
        </div>
        <div className="kpi-card before:bg-gradient-to-r before:from-destructive before:to-transparent">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Out of Stock</p>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">{outCount}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text" placeholder="Search SKU or product..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-4">SKU</th>
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-right py-3 px-4">On Hand</th>
                <th className="text-right py-3 px-4">Reserved</th>
                <th className="text-right py-3 px-4">Available</th>
                <th className="text-right py-3 px-4">Incoming</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.sku} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-primary font-medium">{item.sku}</td>
                  <td className="py-3 px-4 text-foreground">{item.productName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                  <td className="py-3 px-4 text-right font-mono text-foreground">{item.stockOnHand}</td>
                  <td className="py-3 px-4 text-right font-mono text-muted-foreground">{item.reservedStock}</td>
                  <td className="py-3 px-4 text-right font-mono text-foreground font-medium">{item.availableStock}</td>
                  <td className="py-3 px-4 text-right font-mono text-info">{item.incomingStock || '—'}</td>
                  <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{item.warehouseLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
