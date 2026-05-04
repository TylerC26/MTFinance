"use client";

import * as React from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  React.useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#f5f5f5",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <main
          style={{
            maxWidth: "28rem",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            padding: "2rem",
            border: "1px solid #262626",
            borderRadius: "0.75rem",
            background: "#111",
          }}
        >
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: "0.625rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#ef4444",
              margin: 0,
            }}
          >
            Folio · Errata
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              margin: 0,
            }}
          >
            The household books are momentarily unavailable.
          </h1>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#a3a3a3",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            A fault in the application&rsquo;s rendering interrupted this
            request. Try again — if it persists, check the server logs against
            the reference below.
          </p>
          {error.digest ? (
            <code
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: "0.6875rem",
                color: "#737373",
                wordBreak: "break-all",
                paddingTop: "0.75rem",
                borderTop: "1px dashed #262626",
              }}
            >
              {error.digest}
            </code>
          ) : null}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                padding: "0.5rem 0.875rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                background: "#f5f5f5",
                color: "#0a0a0a",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "0.5rem 0.875rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                background: "transparent",
                color: "#f5f5f5",
                border: "1px solid #262626",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
