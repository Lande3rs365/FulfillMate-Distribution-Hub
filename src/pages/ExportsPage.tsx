import { FileDown } from "lucide-react";

const exportOptions = [
  { name: 'Support Update — All Orders', description: 'Full order status export for Tawk/support', format: 'CSV' },
  { name: 'Backlog Report', description: 'Orders awaiting shipment or stock', format: 'XLSX' },
  { name: 'Exception Summary', description: 'Active exceptions with severity', format: 'CSV' },
  { name: 'Inventory Snapshot', description: 'Current stock levels for all SKUs', format: 'XLSX' },
  { name: 'Stock Delay Notices', description: 'Customer notices for stock-delayed orders', format: 'CSV' },
];

export default function ExportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exports</h1>
        <p className="text-sm text-muted-foreground">Generate clean exports for support and operations</p>
      </div>

      <div className="grid gap-3">
        {exportOptions.map(opt => (
          <div key={opt.name} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div>
              <p className="font-medium text-foreground">{opt.name}</p>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
              <FileDown className="w-4 h-4" />
              {opt.format}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
