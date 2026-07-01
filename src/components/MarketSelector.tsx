export function MarketSelector({
  selectedMarkets,
  onChange,
}: {
  selectedMarkets: string[];
  onChange: (markets: string[]) => void;
}) {
  function toggle(market: string) {
    if (selectedMarkets.includes(market)) {
      onChange(selectedMarkets.filter((item) => item !== market));
      return;
    }

    onChange([...selectedMarkets, market]);
  }

  return (
    <fieldset className="panel">
      <legend>Markets</legend>
      <div className="market-options">
        <label>
          <input
            aria-label="United States"
            type="checkbox"
            checked={selectedMarkets.includes("US")}
            onChange={() => toggle("US")}
          />
          United States
        </label>
        <label>
          <input
            aria-label="Singapore"
            type="checkbox"
            checked={selectedMarkets.includes("SGX")}
            onChange={() => toggle("SGX")}
          />
          Singapore
        </label>
      </div>
    </fieldset>
  );
}
