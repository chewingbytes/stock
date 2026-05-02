# Stock Screener Notes

## ELI5: What Is A Stock?

## Requirement Summary From `Stock Screener Application.pdf`

The required application should let users filter stocks by predetermined ranges
and return a table of matching stocks. The PDF lists these screening criteria:

- Market capital size.
- Revenue growth rate.
- Profit growth rate.
- Dividend yield.
- Dividend growth rate.
- Price earnings ratio, or P/E.
- Price to book ratio, or P/B.
- Debt to equity ratio.
- Daily OHLC price data: open, high, low, close.

The required data includes exchange, stock code, date, stock name, daily prices,
market cap, yearly dividend, yearly revenue, yearly profit before tax, yearly
profit after tax, and yearly EBITA.

The output should show the selected criteria and ranges, then a results table
with exchange, stock code, stock name, and the matching criteria values.

An optional later step is to upload the shortlisted stocks to AI for qualitative
review using news, forecasts, and other company considerations.

## Important Data Caveats

The hardest part of this project is not the filter UI. It is getting reliable
stock data and keeping it current.

- Daily prices and market cap may need licensed market data.
- Fundamentals such as revenue, profit, equity, debt, and dividends may be
  updated quarterly or yearly, not daily.
- Different data providers may use different names or formulas for the same
  metric.
- Some companies have missing or stale data.
- Stock codes can change, companies can delist, and the same company can be
  listed on multiple exchanges.
- AI recommendations must cite source data and avoid pretending to be financial
  advice.