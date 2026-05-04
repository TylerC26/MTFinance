"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { MenuIcon } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SIDEBAR_INNER = (today: string) => (
  <>
    <Link
      href="/"
      className="flex items-baseline justify-between gap-2 px-5 h-16 border-b border-sidebar-border"
    >
      <span className="font-display text-xl tracking-tight">
        M&amp;T Finance
        <span className="text-accent">.</span>
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        mtf · 26
      </span>
    </Link>
    <Suspense>
      <SidebarNav />
    </Suspense>
    <div className="mt-auto px-5 py-5 border-t border-sidebar-border">
      <p className="eyebrow">Almanac edition</p>
      <p className="font-mono text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
        For Tyler &amp; Michelle
        <br />
        {today}
      </p>
    </div>
  </>
);

export function DesktopSidebar({ today }: { today: string }) {
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-col">
      {SIDEBAR_INNER(today)}
    </aside>
  );
}

export function MobileSidebarTrigger({ today }: { today: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="lg:hidden size-9 -ml-1 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <MenuIcon className="size-5" />
          </button>
        }
      />
      <SheetContent
        side="left"
        className="w-[260px] bg-sidebar text-sidebar-foreground p-0 flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div onClick={() => setOpen(false)} className="contents">
          {SIDEBAR_INNER(today)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
