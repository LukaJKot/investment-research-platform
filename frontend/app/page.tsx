"use client";

import { useState } from "react";

function labelColor(label: string) {
  if (label === "Strong") return "text-green-700 bg-green-50";
  if (label === "Average") return "text-yellow-700 bg-yellow-50";
  return "text-red-700 bg-red-50";
}

function ratingColor(rating: string) {
  if (rating === "Excellent" || rating === "Strong") return "text-green-700";
  if (rating === "Average") return "text-yellow-700";
  return "text-red-700";
}

function RatioRow({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
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
        <span className="text-xs text-gray-600">{weight} of score</span>
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
        <span className="text-sm font-medium text-gray-700">Category Score</span>
        <span className="text-sm font-bold text-gray-900">{data.category_score} / 10</span>
      </div>
    </div>
  );
}

function TrendsTable({ trends }: { trends: any[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">5-Year Trend</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600 border-b border-gray-200">
            <th className="pb-2 font-medium">Year</th>
            <th className="pb-2 font-medium text-right">Revenue</th>
            <th className="pb-2 font-medium text-right">Net Income</th>
            <th className="pb-2 font-medium text-right">Gross Margin</th>
          </tr>
        </thead>
        <tbody>
          {trends.map((row) => (
            <tr key={row.fiscal_year} className="border-b border-gray-50 last:border-0">
              <td className="py-2 text-gray-800 font-medium">{row.fiscal_year}</td>
              <td className="py-2 text-right text-gray-900">${(row.revenue / 1e9).toFixed(1)}B</td>
              <td className="py-2 text-right text-gray-900">${(row.net_income / 1e9).toFixed(1)}B</td>
              <td className="py-2 text-right text-gray-900">{(row.gross_margin * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PeerTable({ ticker, overallScore, rating, peers }: { ticker: string; overallScore: number; rating: string; peers: any[] }) {
  const rows = [{ ticker, overall_score: overallScore, rating, isTarget: true }, ...peers.map((p) => ({ ...p, isTarget: false }))];
  rows.sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Peer Comparison</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600 border-b border-gray-200">
            <th className="pb-2 font-medium">Ticker</th>
            <th className="pb-2 font-medium text-right">Score</th>
            <th className="pb-2 font-medium text-right">Rating</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ticker} className={`border-b border-gray-50 last:border-0 ${row.isTarget ? "bg-blue-50 font-semibold" : ""}`}>
              <td className="py-2 text-gray-900">{row.ticker}{row.isTarget && <span className="text-xs text-blue-600 ml-1">(this company)</span>}</td>
              <td className="py-2 text-right text-gray-900">{row.overall_score}</td>
              <td className={`py-2 text-right font-medium ${ratingColor(row.rating)}`}>{row.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemoCard({ memo }: { memo: string }) {
  const paragraphs = memo.split("\n").filter((p) => p.trim().length > 0);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">Research Memo</h3>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-gray-800 leading-relaxed">{p}</p>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-4 pt-3 border-t border-gray-100">
        AI-generated summary of pre-calculated, rules-based data above. Not investment advice.
      </p>
    </div>
  );
}

function SentimentCard({ bullish, bearish }: { bullish: any[]; bearish: any[] }) {
  if (bullish.length === 0 && bearish.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
      <h3 className="font-semibold text-gray-900 mb-4">Market Sentiment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-semibold text-green-700 mb-2">Bullish Themes</p>
          {bullish.length === 0 ? (
            <p className="text-sm text-gray-600">No clear bullish themes found in recent coverage.</p>
          ) : (
            <div className="space-y-3">
              {bullish.map((item, i) => (
  <div key={i} className="text-sm text-gray-800">
    <p>{item.theme}</p>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 inline-block">
      {item.source}
    </a>
  </div>
))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700 mb-2">Bearish Themes</p>
          {bearish.length === 0 ? (
            <p className="text-sm text-gray-600">No clear bearish themes found in recent coverage.</p>
          ) : (
            <div className="space-y-3">
              {bearish.map((item, i) => (
  <div key={i} className="text-sm text-gray-800">
    <p>{item.theme}</p>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 inline-block">
      {item.source}
    </a>
  </div>
))}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-4 pt-3 border-t border-gray-100">
        AI-generated summary of recent news coverage. This is separate from the Investment Score above, which is based entirely on financial data.
      </p>
    </div>
  );
}

function ValuationCard({ valuation }: { valuation: any }) {
  if (!valuation || valuation.price === null) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Valuation</h3>
        <span className="text-xs text-gray-600">not included in score</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600 mb-1">Current Price</p>
          <p className="text-lg font-bold text-gray-900">${valuation.price}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">P/E Ratio</p>
          <p className="text-lg font-bold text-gray-900">{valuation.pe_ratio ?? "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">P/B Ratio</p>
          <p className="text-lg font-bold text-gray-900">{valuation.pb_ratio ?? "N/A"}</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
        Valuation is shown for reference only — whether a given P/E or P/B is "good" depends on your investing style (value vs. growth), so it isn't factored into the Investment Score above.
      </p>
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
    const response = await fetch(`https://investment-research-api.onrender.com/stock/${ticker}`);
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
        <p className="text-gray-700 text-sm mb-6">Rules-based fundamental analysis for any public stock</p>

        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter ticker (e.g. AAPL)"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-gray-700">Loading...</p>}

        {stockData && stockData.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3 text-sm">
            {stockData.error}
          </div>
        )}

        {stockData && !stockData.error && (
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6 flex items-center justify-between">
  <div>
    <div className="flex items-center gap-2">
      <p className="text-gray-700 text-sm font-medium">{stockData.ticker}</p>
      {stockData.data_source && stockData.data_source !== "FMP" && (
        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          via {stockData.data_source}
        </span>
      )}
    </div>
    <p className={`text-4xl font-bold ${ratingColor(stockData.scoring.overall.rating)}`}>
      {stockData.scoring.overall.rating}
    </p>
  </div>
  <div className="text-right">
    <p className="text-gray-700 text-sm font-medium">Overall Score</p>
    <p className="text-4xl font-bold text-gray-900">{stockData.scoring.overall.overall_score}<span className="text-lg text-gray-600">/100</span></p>
  </div>
</div>
{stockData.data_notes && stockData.data_notes.length > 0 && (
  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-4 py-3 text-sm mb-6">
    {stockData.data_notes.map((note: string, i: number) => (
      <p key={i}>{note}</p>
    ))}
  </div>
)}

<ValuationCard valuation={stockData.valuation} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

            {stockData.trends && stockData.trends.length > 0 && (
              <TrendsTable trends={stockData.trends} />
            )}

            {stockData.peer_comparison && stockData.peer_comparison.length > 0 && (
              <PeerTable
                ticker={stockData.ticker}
                overallScore={stockData.scoring.overall.overall_score}
                rating={stockData.scoring.overall.rating}
                peers={stockData.peer_comparison}
              />
            )}

            {stockData.memo && (
              <MemoCard memo={stockData.memo} />
            )}
                        <SentimentCard bullish={stockData.bullish_themes || []} bearish={stockData.bearish_themes || []} />

          </div>
        )}
      </div>
    </main>
  );
}