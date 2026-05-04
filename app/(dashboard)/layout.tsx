import * as React from "react";
import { Suspense } from "react";
import { format } from "date-fns";
import { MonthPicker } from "@/components/month-picker";
import {
  DesktopSidebar,
  MobileSidebarTrigger,
} from "@/components/sidebar-shell";
import { MobileDock } from "@/components/mobile-dock";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const today = format(new Date(), "EEE · MMM d, yyyy");
  return (
    <div className="flex min-h-screen">
      <DesktopSidebar today={today} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 sm:gap-4 h-14 sm:h-16 border-b border-border px-4 sm:px-6 lg:px-8">
          <MobileSidebarTrigger today={today} />
          <div className="hidden sm:flex items-baseline gap-3 min-w-0">
            <span className="eyebrow">Folio №01</span>
            <span className="h-3 w-px bg-border" />
            <span className="font-display text-base tracking-tight truncate">
              The Household Books
            </span>
          </div>
          <span className="font-display text-base tracking-tight sm:hidden">
            M&T<span className="text-accent">.</span>
          </span>
          <div className="ml-auto">
            <Suspense>
              <MonthPicker />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileDock />
    </div>
  );
}
