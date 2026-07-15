"use client";

import { useState } from "react";

function labelColor(label: string) {
  if (label === "Strong") return "text-green-600 bg-green-50";
  if (label === "Average") return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

function ratingColor(rating: string) {
  if (rating === "Excellent" || rating === "Strong") return "text-green-600";
  if (rating === "Average") return "text-yellow-600";
  return "text-red-600";
}

function RatioRow({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${labelColor(label)}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

function CategoryCard({ title, weight, data, rows }: { title: string; weight: string; data: any; rows: { key: string; name: string; format: (v: number) => string }[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400">{weight} of score</span>
      </div>
      {rows.map((row) => (
        <RatioRow
          key={row.key}
          name={row.name}
          value={data[row.key].value === null ? "N/A" : row.format(data[row.key].value)}
          label={data[row.key].label}
        />
      ))}
      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500">Category Score</span>
        <span className="text-sm font-bold">{data.category_score} / 10</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!ticker) return;
    setLoading(true);
    setStockData(null);
    const response = await fetch(`http://127.0.0.1:8000/stock/${ticker}`);
    const data = await response.json();
    setStockData(data);
    setLoading(false);
  };

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const num = (v: number) => v.toFixed(2);
  const x = (v: number) => `${v.toFixed(1)}x`;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Investment Research Platform</h1>
        <p className="text-gray-500 text-sm mb-6">Rules-based fundamental analysis for any public stock</p>

        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter ticker (e.g. AAPL)"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}

        {stockData && stockData.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
            {stockData.error}
          </div>
        )}

        {stockData && !stockData.error && (
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stockData.ticker}</p>
                <p className={`text-4xl font-bold ${ratingColor(stockData.scoring.overall.rating)}`}>
                  {stockData.scoring.overall.rating}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">Overall Score</p>
                <p className="text-4xl font-bold text-gray-900">{stockData.scoring.overall.overall_score}<span className="text-lg text-gray-400">/100</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CategoryCard
                title="Profitability"
                weight="35%"
                data={{
                  gross_margin: { value: stockData.ratios.profitability.gross_margin, label: stockData.scoring.profitability.gross_margin.label },
                  net_margin: { value: stockData.ratios.profitability.net_margin, label: stockData.scoring.profitability.net_margin.label },
                  roe: { value: stockData.ratios.profitability.roe, label: stockData.scoring.profitability.roe.label },
                  roa: { value: stockData.ratios.profitability.roa, label: stockData.scoring.profitability.roa.label },
                  category_score: stockData.scoring.profitability.category_score,
                }}
                rows={[
                  { key: "gross_margin", name: "Gross Margin", format: pct },
                  { key: "net_margin", name: "Net Margin", format: pct },
                  { key: "roe", name: "ROE", format: pct },
                  { key: "roa", name: "ROA", format: pct },
                ]}
              />
              <CategoryCard
                title="Leverage"
                weight="25%"
                data={{
                  debt_to_equity: { value: stockData.ratios.leverage.debt_to_equity, label: stockData.scoring.leverage.debt_to_equity.label },
                  interest_coverage: { value: stockData.ratios.leverage.interest_coverage, label: stockData.scoring.leverage.interest_coverage.label },
                  category_score: stockData.scoring.leverage.category_score,
                }}
                rows={[
                  { key: "debt_to_equity", name: "Debt-to-Equity", format: num },
                  { key: "interest_coverage", name: "Interest Coverage", format: x },
                ]}
              />
              <CategoryCard
                title="Liquidity"
                weight="15%"
                data={{
                  current_ratio: { value: stockData.ratios.liquidity.current_ratio, label: stockData.scoring.liquidity.current_ratio.label },
                  quick_ratio: { value: stockData.ratios.liquidity.quick_ratio, label: stockData.scoring.liquidity.quick_ratio.label },
                  category_score: stockData.scoring.liquidity.category_score,
                }}
                rows={[
                  { key: "current_ratio", name: "Current Ratio", format: num },
                  { key: "quick_ratio", name: "Quick Ratio", format: num },
                ]}
              />
              <CategoryCard
                title="Growth"
                weight="25%"
                data={{
                  revenue_growth: { value: stockData.ratios.growth.revenue_growth, label: stockData.scoring.growth.revenue_growth.label },
                  net_income_growth: { value: stockData.ratios.growth.net_income_growth, label: stockData.scoring.growth.net_income_growth.label },
                  category_score: stockData.scoring.growth.category_score,
                }}
                rows={[
                  { key: "revenue_growth", name: "Revenue Growth (YoY)", format: pct },
                  { key: "net_income_growth", name: "Net Income Growth (YoY)", format: pct },
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}