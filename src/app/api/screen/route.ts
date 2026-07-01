import { NextResponse } from "next/server";
import { z } from "zod";
import { metricKeys } from "../../../domain/filtering";
import { runScreen } from "../../../server/screener/screenerService";

const requestSchema = z.object({
  markets: z.array(z.string()).min(1),
  filters: z.array(
    z.object({
      metricKey: z.enum(metricKeys),
      min: z.number().finite().nullable(),
      max: z.number().finite().nullable(),
    }),
  ),
  sort: z.object({
    metricKey: z.union([
      z.enum(metricKeys),
      z.literal("stock_code"),
      z.literal("stock_name"),
    ]),
    direction: z.enum(["asc", "desc"]),
  }),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const result = await runScreen(parsed.data);
  return NextResponse.json(result);
}
