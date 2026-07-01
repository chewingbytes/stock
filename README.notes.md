# Stock Screener Notes

## ELI5: What Is A Stock?

A stock is a tiny ownership piece of a company. If a company has many shares and
you buy one share, you own a very small part of that company. The share price
goes up or down because buyers and sellers keep changing what they are willing
to pay.

People look at stocks for different reasons:

- Growth: the company may become bigger and more profitable over time.
- Income: the company may pay part of its profit to shareholders as dividends.
- Value: the stock may look cheap compared with the company's earnings, assets,
  or future prospects.

This project must not treat the app as financial advice. A screener helps users
find candidates for further research; it should not tell users that a stock is
safe or guaranteed to make money.

## ELI5: What Is A Stock Screener?

A stock screener is like a search engine for stocks. Instead of typing words,
the user chooses financial rules such as:

- Show companies with market cap between X and Y.
- Show companies with revenue growth above X percent.
- Show companies with dividend yield above X percent.
- Show companies with debt-to-equity below X.
- Show companies where P/E is between X and Y.

The app scans a database of stocks, calculates the requested metrics, and returns
only the stocks that match. The result is a shortlist, not a final decision.

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

## Metric Glossary

- Market cap: company size, roughly share price times number of shares.
- Revenue growth: how much sales increased compared with the prior year.
- Profit growth: how much profit increased compared with the prior year.
- Dividend yield: dividend per share divided by share price.
- Dividend growth: how much dividend per share increased compared with the prior
  year.
- P/E ratio: share price divided by earnings per share. Often used as a rough
  measure of how expensive a stock is relative to profits.
- P/B ratio: share price divided by book value per share. Often used to compare
  price with accounting net assets.
- Debt to equity: total debt divided by shareholder equity. Often used as a
  rough leverage or financial risk indicator.
- OHLC: daily open, high, low, and close prices.
