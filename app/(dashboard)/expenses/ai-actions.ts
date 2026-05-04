"use server";

import {
  extractFromApplePay,
  extractFromReceipt,
  extractFromText,
  type ExpenseDraft,
  type ImageMediaType,
} from "@/lib/ai/extract";
import { todayIso } from "@/lib/dates";

type Categories = { id: number; name: string }[];

export type ParseSingleResult =
  | { ok: true; draft: ExpenseDraft }
  | { ok: false; error: string };

export type ParseManyResult =
  | { ok: true; drafts: ExpenseDraft[] }
  | { ok: false; error: string };

export async function parseExpenseFromText(
  text: string,
  categories: Categories,
): Promise<ParseSingleResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Enter something to parse" };
  try {
    const draft = await extractFromText(trimmed, {
      categories,
      todayIso: todayIso(),
    });
    return { ok: true, draft };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function parseExpenseFromReceipt(
  base64: string,
  mediaType: string,
  categories: Categories,
): Promise<ParseSingleResult> {
  const mt = validateMediaType(mediaType);
  if (!mt) return { ok: false, error: "Unsupported image type" };
  if (!base64) return { ok: false, error: "Missing image data" };
  try {
    const draft = await extractFromReceipt(base64, mt, {
      categories,
      todayIso: todayIso(),
    });
    return { ok: true, draft };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function parseExpensesFromApplePay(
  base64: string,
  mediaType: string,
  categories: Categories,
): Promise<ParseManyResult> {
  const mt = validateMediaType(mediaType);
  if (!mt) return { ok: false, error: "Unsupported image type" };
  if (!base64) return { ok: false, error: "Missing image data" };
  try {
    const drafts = await extractFromApplePay(base64, mt, {
      categories,
      todayIso: todayIso(),
    });
    return { ok: true, drafts };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

function validateMediaType(mt: string): ImageMediaType | null {
  if (mt === "image/jpeg" || mt === "image/png" || mt === "image/webp" || mt === "image/gif") {
    return mt;
  }
  return null;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "AI extraction failed";
}
