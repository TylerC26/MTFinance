"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  HomeIcon,
  MenuIcon,
  PlusIcon,
  ReceiptIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/sidebar-nav";
import {
  ExpenseFormDialog,
  type Category,
} from "@/components/forms/expense-form";
import { cn } from "@/lib/utils";

export function MobileDockClient({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid h-16 grid-cols-5">
        <DockLink
          href="/"
          icon={HomeIcon}
          label="Home"
          pathname={pathname}
          exact
        />
        <DockLink
          href="/expenses"
          icon={ReceiptIcon}
          label="Expenses"
          pathname={pathname}
        />
        <li className="relative flex h-full items-start justify-center">
          <ExpenseFormDialog
            categories={categories}
            trigger={
              <button
                type="button"
                aria-label="Log expense"
                className="absolute -top-7 grid size-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95"
              >
                <PlusIcon className="size-6" />
              </button>
            }
          />
        </li>
        <DockLink
          href="/bills"
          icon={CalendarDaysIcon}
          label="Bills"
          pathname={pathname}
        />
        <li>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Menu"
                  className={cn(
                    "flex h-full w-full flex-col items-center justify-center gap-1 py-2 text-[11px]",
                    "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <MenuIcon className="size-5" />
                  <span>Menu</span>
                </button>
              }
            />
            <SheetContent
              side="right"
              className="flex w-[260px] flex-col bg-sidebar p-0 text-sidebar-foreground"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div onClick={() => setMenuOpen(false)} className="contents">
                <React.Suspense>
                  <SidebarNav />
                </React.Suspense>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}

function DockLink({
  href,
  icon: Icon,
  label,
  pathname,
  exact,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-1 py-2 text-[11px]",
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className={cn("size-5", active && "text-accent")} />
        <span>{label}</span>
      </Link>
    </li>
  );
}
