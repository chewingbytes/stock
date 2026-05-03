import type { MetricKey, RangeFilter } from "../../domain/types";
import { validateRangeFilters } from "../../domain/filtering";
import { prisma } from "../db";

type SortInput = {
  metricKey: MetricKey | "stock_code" | "stock_name";
  direction: "asc" | "desc";
};

export type ScreenInput = {
  markets: string[];
  filters: RangeFilter[];
  sort: SortInput;
  page: number;
  pageSize: number;
};

export type ScreenMetricValue = {
  value: number | null;
  dataQuality: string;
  reason: string | null;
  currency: string | null;
};

export type ScreenRow = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  metrics: Record<string, ScreenMetricValue>;
};

export type ScreenResult = {
  criteria: RangeFilter[];
  total: number;
  page: number;
  pageSize: number;
  rows: ScreenRow[];
};

function metricPassesFilter(
  metric: ScreenMetricValue | undefined,
  filter: RangeFilter,
): boolean {
  if (!metric || metric.dataQuality !== "complete" || metric.value === null) {
    return false;
  }

  if (filter.min !== null && metric.value < filter.min) {
    return false;
  }

  if (filter.max !== null && metric.value > filter.max) {
    return false;
  }

  return true;
}

export async function runScreen(input: ScreenInput): Promise<ScreenResult> {
  const validation = validateRangeFilters(input.filters);

  if (!validation.ok) {
    throw new Error(
      validation.errors
        .map((error) => `${error.field}: ${error.message}`)
        .join("; "),
    );
  }

  const stocks = await prisma.stock.findMany({
    where: {
      market: { code: { in: input.markets } },
      isActive: true,
    },
    include: {
      market: true,
      derivedMetrics: true,
    },
  });

  const rows: ScreenRow[] = stocks.map((stock) => {
    const metrics: Record<string, ScreenMetricValue> = {};

    for (const metric of stock.derivedMetrics) {
      metrics[metric.metricKey] = {
        value: metric.value === null ? null : Number(metric.value),
        dataQuality: metric.dataQuality,
        reason: metric.reason,
        currency: metric.currency,
      };
    }

    return {
      marketCode: stock.market.code,
      exchange: stock.exchange,
      stockCode: stock.stockCode,
      stockName: stock.stockName,
      currency: stock.currency,
      metrics,
    };
  });

  const filteredRows = rows.filter((row) =>
    validation.filters.every((filter) =>
      metricPassesFilter(row.metrics[filter.metricKey], filter),
    ),
  );

  filteredRows.sort((left, right) => {
    const direction = input.sort.direction === "asc" ? 1 : -1;

    if (input.sort.metricKey === "stock_code") {
      return left.stockCode.localeCompare(right.stockCode) * direction;
    }

    if (input.sort.metricKey === "stock_name") {
      return left.stockName.localeCompare(right.stockName) * direction;
    }

    const leftValue =
      left.metrics[input.sort.metricKey]?.value ?? Number.POSITIVE_INFINITY;
    const rightValue =
      right.metrics[input.sort.metricKey]?.value ?? Number.POSITIVE_INFINITY;

    return (leftValue - rightValue) * direction;
  });

  const total = filteredRows.length;
  const start = (input.page - 1) * input.pageSize;
  const pagedRows = filteredRows.slice(start, start + input.pageSize);

  await prisma.screenRun.create({
    data: {
      selectedMarkets: JSON.stringify(input.markets),
      filtersJson: JSON.stringify(validation.filters),
      resultCount: total,
    },
  });

  return {
    criteria: validation.filters,
    total,
    page: input.page,
    pageSize: input.pageSize,
    rows: pagedRows,
  };
}
