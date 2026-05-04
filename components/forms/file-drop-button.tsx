"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropButton({
  id,
  icon: Icon,
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  capture,
  disabled,
  onFile,
  className,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  accept?: string;
  capture?: "user" | "environment";
  disabled?: boolean;
  onFile: (file: File) => void;
  className?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/20 p-6 text-center transition-colors hover:border-foreground/40 hover:bg-muted/40",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <Icon className="size-10 text-muted-foreground" />
      <div className="text-base font-medium">{label}</div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <input
        id={id}
        type="file"
        accept={accept}
        capture={capture}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}
