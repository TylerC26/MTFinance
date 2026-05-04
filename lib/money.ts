const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const usdNoCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatCents(cents: number, opts?: { whole?: boolean }): string {
  return opts?.whole
    ? usdNoCents.format(centsToDollars(cents))
    : usdFormatter.format(centsToDollars(cents));
}

export function dollarsToCents(input: string | number): number {
  const n = typeof input === "string" ? Number(input) : input;
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid money value: ${input}`);
  }
  return Math.round(n * 100);
}
