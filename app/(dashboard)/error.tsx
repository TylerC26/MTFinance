"use client";

import * as React from "react";

export default function ErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  React.useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <section className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow text-destructive">Folio · Errata</p>
          <h2 className="font-display text-2xl tracking-tight leading-none">
            Something went sideways.
          </h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            The page couldn&rsquo;t load. The household books are intact —
            this is a rendering hiccup. Try again, or refresh the page.
          </p>
        </div>
        {error.digest ? (
          <div className="flex flex-col gap-1 border-t border-dashed border-border pt-4">
            <p className="eyebrow">Reference</p>
            <code className="font-mono text-[11px] text-muted-foreground tracking-wide break-all">
              {error.digest}
            </code>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Reload
          </button>
        </div>
      </section>
    </div>
  );
}
