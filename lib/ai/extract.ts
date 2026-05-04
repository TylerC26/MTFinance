import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./client";

export type ExpenseDraft = {
  occurredOn: string;
  amount: number;
  categoryId: number | null;
  payer: "tyler" | "wife" | "joint" | null;
  description: string;
};

export type ExtractCtx = {
  categories: { id: number; name: string }[];
  todayIso: string;
};

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const HAIKU = "claude-haiku-4-5";
const SONNET = "claude-sonnet-4-6";

const draftSchema = {
  type: "object" as const,
  properties: {
    occurredOn: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      description: "ISO date the expense was incurred (yyyy-mm-dd).",
    },
    amount: {
      type: "number",
      minimum: 0.01,
      description: "Amount in dollars (not cents).",
    },
    categoryId: {
      type: "integer",
      description: "Best-matching category id from the provided list. Omit if nothing fits cleanly.",
    },
    payer: {
      type: "string",
      enum: ["tyler", "wife", "joint"],
      description: "Who paid. Omit if not stated.",
    },
    description: {
      type: "string",
      maxLength: 120,
      description: "Short description (merchant or item name, ≤120 chars).",
    },
  },
  required: ["occurredOn", "amount", "description"],
};

function systemPrompt(ctx: ExtractCtx, extra?: string): string {
  const cats = ctx.categories.map((c) => `- ${c.id}: ${c.name}`).join("\n");
  const base = `You extract expense entries from short user input.
Today is ${ctx.todayIso}. Use this for relative dates ("yesterday", "last Friday"); when the date is not stated, default to today.
Map a free-text category to one of these ids; if nothing fits cleanly, use null:
${cats}
The payer field uses these enum values: "tyler" (the user), "wife" (his wife Michelle — also recognize "michelle"), "joint" (both). Default payer to null when not stated. Keep descriptions short (merchant or item).`;
  return extra ? `${base}\n${extra}` : base;
}

export async function extractFromText(
  text: string,
  ctx: ExtractCtx,
): Promise<ExpenseDraft> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: HAIKU,
    max_tokens: 1024,
    system: systemPrompt(ctx),
    tools: [
      {
        name: "record_expense",
        description: "Record a single expense parsed from the user's text.",
        input_schema: draftSchema,
      },
    ],
    tool_choice: { type: "tool", name: "record_expense" },
    messages: [{ role: "user", content: text }],
  });
  return normalizeDraft(extractToolInput(res));
}

export async function extractFromReceipt(
  base64: string,
  mediaType: ImageMediaType,
  ctx: ExtractCtx,
): Promise<ExpenseDraft> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: SONNET,
    max_tokens: 1024,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: systemPrompt(
      ctx,
      "The user uploaded a photo of a receipt. Use the merchant name as the description, the receipt date as occurredOn, and the grand total (after tax/tip) as the amount.",
    ),
    tools: [
      {
        name: "record_expense",
        description: "Record a single expense from the receipt.",
        input_schema: draftSchema,
      },
    ],
    tool_choice: { type: "tool", name: "record_expense" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "Extract the expense from this receipt." },
        ],
      },
    ],
  });
  return normalizeDraft(extractToolInput(res));
}

export async function extractFromApplePay(
  base64: string,
  mediaType: ImageMediaType,
  ctx: ExtractCtx,
): Promise<ExpenseDraft[]> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: HAIKU,
    max_tokens: 4096,
    system: systemPrompt(
      ctx,
      "The user uploaded a screenshot of Apple Pay or a card transaction list. Extract every visible completed transaction as a separate expense. Skip pending transactions, totals, balances, refunds, and credits.",
    ),
    tools: [
      {
        name: "record_expenses",
        description: "Record every completed transaction visible in the screenshot.",
        input_schema: {
          type: "object" as const,
          properties: {
            expenses: {
              type: "array",
              minItems: 1,
              items: draftSchema,
            },
          },
          required: ["expenses"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "record_expenses" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "Extract every visible completed transaction." },
        ],
      },
    ],
  });
  const input = extractToolInput(res) as { expenses?: unknown };
  if (!Array.isArray(input.expenses)) {
    throw new Error("AI did not return an expense list.");
  }
  return input.expenses.map(normalizeDraft);
}

function extractToolInput(res: Anthropic.Message): unknown {
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("AI did not return a structured response.");
  }
  return block.input;
}

function normalizeDraft(raw: unknown): ExpenseDraft {
  const r = (raw ?? {}) as Partial<ExpenseDraft>;
  return {
    occurredOn: String(r.occurredOn ?? ""),
    amount: Number(r.amount ?? 0),
    categoryId: r.categoryId == null ? null : Number(r.categoryId),
    payer:
      r.payer === "tyler" || r.payer === "wife" || r.payer === "joint"
        ? r.payer
        : null,
    description: String(r.description ?? "").slice(0, 120),
  };
}
