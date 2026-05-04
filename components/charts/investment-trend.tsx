"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { formatCents } from "@/lib/money";

type Point = { as_of: string; total_cents: number };

export function InvestmentTrendChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground font-mono">
        — no balances logged —
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="capital-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="0 4"
          stroke="var(--border)"
          horizontal
          vertical={false}
        />
        <XAxis
          dataKey="as_of"
          tickFormatter={(v) => format(new Date(v), "MMM").toLowerCase()}
          fontSize={10}
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
          tick={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          dy={6}
        />
        <YAxis
          tickFormatter={(v) => formatCents(Number(v), { whole: true })}
          fontSize={10}
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
          tick={{ fontFamily: "var(--font-mono)" }}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            boxShadow: "0 8px 32px -12px rgb(0 0 0 / 0.4)",
          }}
          labelStyle={{
            color: "var(--muted-foreground)",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
          labelFormatter={(v) =>
            format(new Date(v as string), "MMM d, yyyy").toLowerCase()
          }
          formatter={(v) => [formatCents(Number(v)), "Total"]}
        />
        <Area
          type="monotone"
          dataKey="total_cents"
          stroke="var(--accent)"
          strokeWidth={1.5}
          fill="url(#capital-fill)"
          dot={false}
          activeDot={{ r: 3, fill: "var(--accent)", stroke: "var(--background)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
