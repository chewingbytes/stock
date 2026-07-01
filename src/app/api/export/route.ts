import { NextResponse } from "next/server";
import { z } from "zod";
import { metricKeys } from "../../../domain/filtering";
import { buildScreenCsv } from "../../../server/export/csvExport";
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
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const result = await runScreen({
    ...parsed.data,
    page: 1,
    pageSize: 10_000,
  });

  const csv = buildScreenCsv({
    generatedAt: new Date(),
    criteria: result.criteria,
    rows: result.rows,
  });

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="stock-screen.csv"',
    },
  });
}
