"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, ArrowDownIcon } from "lucide-react";

const THRESHOLD = 70;
const MAX_PULL = 110;
const RESISTANCE = 0.55;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startY = React.useRef<number | null>(null);
  const tracking = React.useRef(false);

  React.useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (window.scrollY > 0) return;
      startY.current = e.touches[0]?.clientY ?? null;
      tracking.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current || startY.current === null || refreshing) return;
      const delta = (e.touches[0]?.clientY ?? 0) - startY.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      setPull(Math.min(delta * RESISTANCE, MAX_PULL));
    };

    const onTouchEnd = () => {
      if (!tracking.current) return;
      tracking.current = false;
      startY.current = null;
      setPull((current) => {
        if (current >= THRESHOLD) {
          setRefreshing(true);
          router.refresh();
          window.setTimeout(() => {
            setRefreshing(false);
            setPull(0);
          }, 700);
          return THRESHOLD;
        }
        return 0;
      });
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [refreshing, router]);

  const visible = pull > 0 || refreshing;
  const progress = Math.min(pull / THRESHOLD, 1);
  const ready = pull >= THRESHOLD;

  return (
    <>
      <div
        aria-hidden={!visible}
        className="lg:hidden pointer-events-none fixed top-0 inset-x-0 z-50 flex justify-center"
        style={{
          transform: `translateY(${visible ? Math.max(8, pull * 0.5) : -40}px)`,
          opacity: refreshing ? 1 : progress,
          transition: pull === 0 && !refreshing ? "transform 0.2s ease, opacity 0.2s ease" : "none",
        }}
      >
        <div className="grid place-items-center size-9 rounded-full bg-card border border-border shadow-md">
          {refreshing ? (
            <Loader2Icon className="size-4 text-accent animate-spin" />
          ) : (
            <ArrowDownIcon
              className={`size-4 transition-colors ${ready ? "text-accent" : "text-muted-foreground"}`}
              style={{
                transform: `rotate(${ready ? 180 : 0}deg)`,
                transition: "transform 0.2s ease",
              }}
            />
          )}
        </div>
      </div>
      {children}
    </>
  );
}
