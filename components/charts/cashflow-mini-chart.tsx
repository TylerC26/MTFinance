"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCents } from "@/lib/money";
import { formatYearMonthShortLabel } from "@/lib/dates";

type Point = {
  ym: string;
  incomeCents: number;
  spendCents: number;
  billsCents: number;
};

export function CashflowMiniChart({ data }: { data: Point[] }) {
  if (
    data.every(
      (p) => p.incomeCents === 0 && p.spendCents === 0 && p.billsCents === 0,
    )
  ) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground font-mono">
        — no entries to chart —
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 6, right: 8, bottom: 0, left: 0 }}
        barCategoryGap="22%"
      >
        <CartesianGrid
          strokeDasharray="0 4"
          stroke="var(--border)"
          horizontal
          vertical={false}
        />
        <XAxis
          dataKey="ym"
          tickFormatter={(v) =>
            formatYearMonthShortLabel(v).split(" ")[0].toLowerCase()
          }
          fontSize={9}
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
          tick={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
          dy={4}
          interval={0}
        />
        <YAxis
          tickFormatter={(v) => formatCents(Number(v), { whole: true })}
          fontSize={9}
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
          tick={{ fontFamily: "var(--font-mono)" }}
          width={56}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
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
            formatYearMonthShortLabel(v as string).toLowerCase()
          }
          formatter={(v) => formatCents(Number(v))}
        />
        <Bar
          dataKey="incomeCents"
          name="Earnings"
          fill="var(--positive)"
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey="spendCents"
          name="Outlays"
          fill="var(--accent)"
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey="billsCents"
          name="Bills"
          fill="var(--chart-4)"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
