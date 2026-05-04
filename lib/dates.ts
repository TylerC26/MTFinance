import {
  addMonths,
  endOfMonth,
  format,
  isValid,
  parse,
  startOfMonth,
} from "date-fns";

export type YearMonth = string;

export function currentYearMonth(now: Date = new Date()): YearMonth {
  return format(now, "yyyy-MM");
}

export function parseYearMonth(ym: YearMonth): Date {
  const d = parse(`${ym}-01`, "yyyy-MM-dd", new Date());
  if (!isValid(d)) {
    throw new Error(`Invalid year-month: ${ym}`);
  }
  return d;
}

export function isValidYearMonth(ym: string): ym is YearMonth {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) return false;
  const d = parse(`${ym}-01`, "yyyy-MM-dd", new Date());
  return isValid(d);
}

export function monthBounds(ym: YearMonth) {
  const start = parseYearMonth(ym);
  return {
    start: format(startOfMonth(start), "yyyy-MM-dd"),
    end: format(endOfMonth(start), "yyyy-MM-dd"),
  };
}

export function shiftMonth(ym: YearMonth, by: number): YearMonth {
  return format(addMonths(parseYearMonth(ym), by), "yyyy-MM");
}

export function formatYearMonthLabel(ym: YearMonth): string {
  return format(parseYearMonth(ym), "MMMM yyyy");
}

export function formatYearMonthShortLabel(ym: YearMonth): string {
  return format(parseYearMonth(ym), "MMM yyyy");
}

export function lastNMonths(count: number, anchor: YearMonth = currentYearMonth()): YearMonth[] {
  const out: YearMonth[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(shiftMonth(anchor, -i));
  }
  return out;
}

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}
