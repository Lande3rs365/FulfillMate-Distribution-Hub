import { useState, useRef, useCallback, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
  className?: string;
}

const THRESHOLD = 64;

export default function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = containerRef.current;
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      // Dampen the pull distance
      setPullDistance(Math.min(dy * 0.4, THRESHOLD * 1.5));
    } else {
      pulling.current = false;
      setPullDistance(0);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  if (!isMobile) {
    return <main className={cn("flex-1 overflow-auto", className)}>{children}</main>;
  }

  return (
    <main
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn("flex-1 overflow-auto relative", className)}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <div className="flex flex-col items-center gap-1">
          <RefreshCw
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              refreshing && "animate-spin text-primary",
              pullDistance >= THRESHOLD && !refreshing && "text-primary"
            )}
            style={{
              transform: refreshing ? undefined : `rotate(${Math.min(pullDistance / THRESHOLD, 1) * 360}deg)`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">
            {refreshing ? "Refreshing…" : pullDistance >= THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>
      {children}
    </main>
  );
}
