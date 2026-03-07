import StatusBadge from "@/components/StatusBadge";
import { mockExceptions } from "@/data/mockData";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function ExceptionsPage() {
  const active = mockExceptions.filter(e => !e.resolved);
  const resolved = mockExceptions.filter(e => e.resolved);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exception Queue</h1>
        <p className="text-sm text-muted-foreground">{active.length} active · {resolved.length} resolved</p>
      </div>

      <div className="space-y-3">
        {active.map(exc => (
          <div key={exc.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-primary">{exc.orderId}</span>
                  <StatusBadge status={exc.severity} />
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">{exc.type}</span>
                </div>
                <p className="text-sm text-foreground">{exc.description}</p>
              </div>
            </div>
            <button className="px-3 py-1.5 text-xs bg-muted text-muted-foreground rounded-md hover:bg-accent transition-colors">
              Resolve
            </button>
          </div>
        ))}

        {resolved.length > 0 && (
          <>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground pt-4">Resolved</h3>
            {resolved.map(exc => (
              <div key={exc.id} className="bg-card border border-border/50 rounded-lg p-4 opacity-60">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="font-mono text-sm">{exc.orderId}</span>
                  <span className="text-xs text-muted-foreground">{exc.description}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
