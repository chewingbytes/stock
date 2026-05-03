-- CreateTable
CREATE TABLE "Market" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marketId" INTEGER NOT NULL,
    "exchange" TEXT NOT NULL,
    "stockCode" TEXT NOT NULL,
    "stockName" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "providerSymbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Stock_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyPrice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "open" DECIMAL NOT NULL,
    "high" DECIMAL NOT NULL,
    "low" DECIMAL NOT NULL,
    "close" DECIMAL NOT NULL,
    "adjustedClose" DECIMAL,
    "volume" DECIMAL,
    "source" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyPrice_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnualFinancial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "revenue" DECIMAL,
    "profitBeforeTax" DECIMAL,
    "profitAfterTax" DECIMAL,
    "ebita" DECIMAL,
    "totalDebt" DECIMAL,
    "totalEquity" DECIMAL,
    "sharesOutstanding" DECIMAL,
    "earningsPerShare" DECIMAL,
    "bookValuePerShare" DECIMAL,
    "source" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL,
    CONSTRAINT "AnnualFinancial_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnualDividend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "dividendPerShare" DECIMAL,
    "currency" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL,
    CONSTRAINT "AnnualDividend_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketCap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "marketCap" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "calculationMethod" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketCap_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DerivedMetric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "metricKey" TEXT NOT NULL,
    "metricDate" DATETIME,
    "fiscalYear" INTEGER,
    "value" DECIMAL,
    "currency" TEXT,
    "formulaVersion" TEXT NOT NULL,
    "inputSnapshot" TEXT NOT NULL,
    "dataQuality" TEXT NOT NULL,
    "reason" TEXT,
    CONSTRAINT "DerivedMetric_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScreenRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectedMarkets" TEXT NOT NULL,
    "filtersJson" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "importType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "message" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_code_key" ON "Market"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_marketId_stockCode_key" ON "Stock"("marketId", "stockCode");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPrice_stockId_date_key" ON "DailyPrice"("stockId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualFinancial_stockId_fiscalYear_key" ON "AnnualFinancial"("stockId", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualDividend_stockId_fiscalYear_key" ON "AnnualDividend"("stockId", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "MarketCap_stockId_date_source_key" ON "MarketCap"("stockId", "date", "source");

-- CreateIndex
CREATE UNIQUE INDEX "DerivedMetric_stockId_metricKey_formulaVersion_key" ON "DerivedMetric"("stockId", "metricKey", "formulaVersion");
