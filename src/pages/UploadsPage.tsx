import { Upload, FileSpreadsheet, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const sources = ['WooCommerce', 'Pirate Ship', 'ShipStation', 'Inventory / Stock'];

export default function UploadsPage() {
  const [selectedSource, setSelectedSource] = useState(sources[0]);
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<{ name: string; source: string; time: string }[]>([
    { name: 'woo_export_mar04.csv', source: 'WooCommerce', time: '2 hours ago' },
    { name: 'pirateship_mar03.csv', source: 'Pirate Ship', time: '1 day ago' },
    { name: 'inventory_snapshot_mar05.xlsx', source: 'Inventory / Stock', time: '30 min ago' },
  ]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const newUploads = files.map(f => ({ name: f.name, source: selectedSource, time: 'Just now' }));
    setUploads(prev => [...newUploads, ...prev]);
  }, [selectedSource]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Intake</h1>
        <p className="text-sm text-muted-foreground">Upload order, shipment, and inventory files</p>
      </div>

      {/* Source selector */}
      <div className="flex gap-2">
        {sources.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSource(s)}
            className={cn(
              "px-4 py-2 rounded-md text-sm border transition-colors",
              s === selectedSource
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
        )}
      >
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-foreground font-medium">Drop {selectedSource} files here</p>
        <p className="text-sm text-muted-foreground mt-1">CSV or XLSX files supported</p>
        <label className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm cursor-pointer hover:bg-primary/90 transition-colors">
          Browse Files
          <input type="file" className="hidden" accept=".csv,.xlsx,.xls" multiple onChange={e => {
            const files = Array.from(e.target.files || []);
            const newUploads = files.map(f => ({ name: f.name, source: selectedSource, time: 'Just now' }));
            setUploads(prev => [...newUploads, ...prev]);
          }} />
        </label>
      </div>

      {/* Upload history */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-3">Recent Uploads</h2>
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-success" />
                <div>
                  <p className="text-sm font-mono text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.source}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-muted-foreground">{u.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
