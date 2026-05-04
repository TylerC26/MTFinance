import * as React from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 pb-5 sm:pb-6 border-b border-border">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight leading-none">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {meta ? (
            <div className="font-mono text-[11px] text-muted-foreground tracking-wide order-2 sm:order-1">
              {meta}
            </div>
          ) : null}
          {action ? <div className="order-1 sm:order-2">{action}</div> : null}
        </div>
      </div>
    </header>
  );
}
