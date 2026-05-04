"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { formatCents } from "@/lib/money";

type Slice = {
  name: string;
  color: string;
  value: number;
};

export function ExpenseDonut({
  slices,
  totalCents,
}: {
  slices: Slice[];
  totalCents: number;
}) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const visible = slices.filter((s) => s.value > 0);

  if (visible.length === 0 || totalCents === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground font-mono">
        — no outlays this month —
      </div>
    );
  }

  const focused =
    hovered != null && visible[hovered] ? visible[hovered] : null;
  const focusValue = focused ? focused.value : totalCents;
  const focusPct =
    totalCents > 0 ? (focusValue / totalCents) * 100 : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="relative flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={1.5}
              stroke="var(--card)"
              strokeWidth={2}
              onMouseEnter={(_, idx) => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              isAnimationActive={false}
            >
              {visible.map((s, i) => (
                <Cell
                  key={s.name}
                  fill={s.color}
                  opacity={hovered == null || hovered === i ? 1 : 0.35}
                  style={{ transition: "opacity 200ms" }}
                />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              content={() => null}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="eyebrow mb-1">
            {focused ? focused.name : "Total"}
          </p>
          <p className="font-mono text-2xl tabular-nums leading-none">
            {formatCents(focusValue, { whole: true })}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground tracking-wide mt-1.5">
            {focused
              ? `${focusPct.toFixed(1)}% of month`
              : `${visible.length} categor${visible.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs">
        {visible.map((s, i) => {
          const pct = (s.value / totalCents) * 100;
          return (
            <li
              key={s.name}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="leader cursor-default"
              style={{
                opacity: hovered == null || hovered === i ? 1 : 0.45,
                transition: "opacity 200ms",
              }}
            >
              <span className="flex items-center gap-2 shrink-0 min-w-0">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                  aria-hidden
                />
                <span className="truncate">{s.name}</span>
              </span>
              <span className="leader-line" aria-hidden />
              <span className="font-mono tabular-nums shrink-0 text-muted-foreground">
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
