import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Warehouse, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/orders", label: "Orders", icon: Package },
  { path: "/inventory", label: "Inventory", icon: Warehouse },
  { path: "/shipments", label: "Shipments", icon: Truck },
] as const;

export default function MobileBottomTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="flex items-stretch border-t border-border bg-sidebar shrink-0 safe-area-bottom">
      {tabs.map(tab => {
        const isActive = tab.path === "/" ? pathname === "/" : pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <tab.icon className={cn("w-5 h-5", isActive && "text-primary")} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
