"use client";

import { useState } from "react";

// ---------- Design tokens ----------
const ACCENT = "#2d5a96";
const ACCENT_DARK = "#1d3f66";
const GOLD = "#b8a76d";
const GREEN = "#0a7c4f";
const RED = "#b3261e";

function labelColor(label: string) {
  if (label === "Strong") return "text-emerald-700 bg-emerald-50";
  if (label === "Average") return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

function ratingColor(rating: string) {
  if (rating === "Excellent" || rating === "Strong") return "text-emerald-700";
  if (rating === "Average") return "text-amber-700";
  return "text-red-700";
}

function recommendationColor(rec: string) {
  const r = rec?.toLowerCase();
  if (r === "strong_buy" || r === "buy") return "text-emerald-700 bg-emerald-50";
  if (r === "hold") return "text-amber-700 bg-amber-50";
  if (r === "sell" || r === "strong_sell") return "text-red-700 bg-red-50";
  return "text-gray-700 bg-gray-50";
}

function formatRecommendation(rec: string) {
  if (!rec) return "N/A";
  return rec.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- Small building blocks ----------

function RatioRow({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${labelColor(label)}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: `linear-gradient(90deg, ${ACCENT}, ${GOLD})`,
        }}
      />
    </div>
  );
}

function CategoryCard({
  title,
  weight,
  data,
  rows,
  maxScore,
}: {
  title: string;
  weight: string;
  data: any;
  rows: { key: string; name: string; format: (v: number) => string }[];
  maxScore: number;
}) {
  const pct = (data.category_score / maxScore) * 100;
  return (
    <div className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div
        className="h-[3px] w-10 rounded-full mb-4"
        style={{ background: `linear-gradient(90deg, ${ACCENT}, ${GOLD})` }}
      />
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900 text-[15px]">{title}</h3>
        <span className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{weight}</span>
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: ACCENT }}>
        {data.category_score}
        <span className="text-sm text-gray-400 font-medium"> / {maxScore}</span>
      </p>
      <ScoreBar pct={pct} />
      <div className="mt-4">
        {rows.map((row) => (
          <RatioRow
            key={row.key}
            name={row.name}
            value={data[row.key].value === null ? "N/A" : row.format(data[row.key].value)}
            label={data[row.key].label}
          />
        ))}
      </div>
    </div>
  );
}

function TrendsTable({ trends }: { trends: any[] }) {
  const maxRevenue = Math.max(...trends.map((t) => t.revenue));
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900 text-[15px]">
          <i className="ti ti-chart-bar mr-1.5" style={{ color: ACCENT }}></i>
          5-Year Trend
        </h3>
      </div>

      <div className="flex items-end gap-2 h-28 mb-4 px-1">
        {trends.map((row, i) => {
          const heightPct = (row.revenue / maxRevenue) * 100;
          const isLast = i === trends.length - 1;
          return (
            <div
              key={row.fiscal_year}
              className="flex-1 rounded-t-md transition-all duration-300 cursor-pointer hover:opacity-80"
              style={{
                height: `${heightPct}%`,
                background: isLast
                  ? `linear-gradient(180deg, ${GOLD}, rgba(184,167,109,0.25))`
                  : `linear-gradient(180deg, ${ACCENT}, rgba(45,90,150,0.2))`,
                boxShadow: isLast ? "0 4px 12px rgba(184,167,109,0.3)" : "none",
              }}
              title={`${row.fiscal_year}: $${(row.revenue / 1e9).toFixed(1)}B`}
            />
          );
        })}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="pb-2 font-medium text-xs uppercase tracking-wide">Year</th>
            <th className="pb-2 font-medium text-xs uppercase tracking-wide text-right">Revenue</th>
            <th className="pb-2 font-medium text-xs uppercase tracking-wide text-right">Net Income</th>
            <th className="pb-2 font-medium text-xs uppercase tracking-wide text-right">Gross Margin</th>
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <h3 className="font-semibold text-gray-900 text-[15px] mb-4">
        <i className="ti ti-scale mr-1.5" style={{ color: ACCENT }}></i>
        Peer Comparison
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="pb-2 font-medium text-xs uppercase tracking-wide">Ticker</th>
            <th className="pb-2 font-medium text-xs uppercase tracking-wide text-right">Score</th>
            <th className="pb-2 font-medium text-xs uppercase tracking-wide text-right">Rating</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.ticker}
              className={`border-b border-gray-50 last:border-0 transition-colors ${
                row.isTarget ? "bg-blue-50/60 font-semibold" : "hover:bg-gray-50"
              }`}
            >
              <td className="py-2.5 text-gray-900">
                {row.ticker}
                {row.isTarget && (
                  <span className="text-xs font-medium ml-1.5" style={{ color: ACCENT }}>
                    (this company)
                  </span>
                )}
              </td>
              <td className="py-2.5 text-right text-gray-900">{row.overall_score}</td>
              <td className={`py-2.5 text-right font-medium ${ratingColor(row.rating)}`}>{row.rating}</td>
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <h3 className="font-semibold text-gray-900 text-[15px] mb-4">
        <i className="ti ti-notes mr-1.5" style={{ color: ACCENT }}></i>
        Research Memo
      </h3>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-gray-700 leading-relaxed">{p}</p>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
        AI-generated summary of pre-calculated, rules-based data above. Not investment advice.
      </p>
    </div>
  );
}

function AnalystConsensusCard({ consensus }: { consensus: any }) {
  if (!consensus) return null;

  return (
    <div
      className="rounded-xl p-6 shadow-sm mb-6 border border-gray-200"
      style={{ background: `linear-gradient(135deg, rgba(45,90,150,0.05), rgba(184,167,109,0.05))` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-[15px]">
          <i className="ti ti-users mr-1.5" style={{ color: ACCENT }}></i>
          Analyst Consensus
        </h3>
        <span className="text-xs text-gray-500 font-medium">{consensus.num_analysts} analysts</span>
      </div>
      <div className="flex items-center justify-between mb-5">
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${recommendationColor(consensus.recommendation)}`}>
          {formatRecommendation(consensus.recommendation)}
        </span>
        {consensus.upside_pct !== null && (
          <span className={`text-sm font-semibold flex items-center gap-1 ${consensus.upside_pct >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            <i className={`ti ${consensus.upside_pct >= 0 ? "ti-trending-up" : "ti-trending-down"}`}></i>
            {consensus.upside_pct >= 0 ? "+" : ""}{consensus.upside_pct}% to target
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Low Target</p>
          <p className="text-base font-bold text-gray-900">${consensus.target_low_price ?? "N/A"}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Avg Target</p>
          <p className="text-base font-bold" style={{ color: ACCENT }}>${consensus.target_mean_price ?? "N/A"}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">High Target</p>
          <p className="text-base font-bold text-gray-900">${consensus.target_high_price ?? "N/A"}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
        Aggregated opinions from Wall Street analysts — a separate, external perspective, not part of the rules-based Investment Score.
      </p>
    </div>
  );
}

function SentimentCard({ bullish, bearish }: { bullish: any[]; bearish: any[] }) {
  if (bullish.length === 0 && bearish.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <h3 className="font-semibold text-gray-900 text-[15px] mb-5">
        <i className="ti ti-message-circle mr-1.5" style={{ color: ACCENT }}></i>
        Market Sentiment
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-1.5">
            <i className="ti ti-trending-up"></i> Bullish Themes
          </p>
          {bullish.length === 0 ? (
            <p className="text-sm text-gray-500">No clear bullish themes found in recent coverage.</p>
          ) : (
            <div className="space-y-3">
              {bullish.map((item, i) => (
                <div key={i} className="text-sm text-gray-700 bg-emerald-50/50 rounded-lg p-3">
                  <p>{item.theme}</p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                    {item.source}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-1.5">
            <i className="ti ti-trending-down"></i> Bearish Themes
          </p>
          {bearish.length === 0 ? (
            <p className="text-sm text-gray-500">No clear bearish themes found in recent coverage.</p>
          ) : (
            <div className="space-y-3">
              {bearish.map((item, i) => (
                <div key={i} className="text-sm text-gray-700 bg-red-50/50 rounded-lg p-3">
                  <p>{item.theme}</p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                    {item.source}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-5 pt-3 border-t border-gray-100">
        AI-generated summary of recent news coverage. This is separate from the Investment Score above, which is based entirely on financial data.
      </p>
    </div>
  );
}

function ValuationCard({ valuation }: { valuation: any }) {
  if (!valuation || valuation.price === null) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-[15px]">
          <i className="ti ti-currency-dollar mr-1.5" style={{ color: ACCENT }}></i>
          Valuation
        </h3>
        <span className="text-xs text-gray-400 font-medium">not included in score</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Current Price</p>
          <p className="text-xl font-bold text-gray-900">${valuation.price}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">P/E Ratio</p>
          <p className="text-xl font-bold text-gray-900">{valuation.pe_ratio ?? "N/A"}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">P/B Ratio</p>
          <p className="text-xl font-bold text-gray-900">{valuation.pb_ratio ?? "N/A"}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
        Valuation is shown for reference only — whether a given P/E or P/B is "good" depends on your investing style (value vs. growth), so it isn't factored into the Investment Score above.
      </p>
    </div>
  );
}

function calculateDcfLive(inputs: any, growthRate: number, wacc: number, terminalGrowth: number) {
  const { most_recent_fcf, total_debt, cash, shares_outstanding } = inputs;
  let fcf = most_recent_fcf;
  let sumDiscounted = 0;
  let lastFcf = fcf;

  for (let year = 1; year <= 5; year++) {
    const weight = (year - 1) / 4;
    const currentGrowth = growthRate + (terminalGrowth - growthRate) * weight;
    fcf = fcf * (1 + currentGrowth);
    sumDiscounted += fcf / Math.pow(1 + wacc, year);
    lastFcf = fcf;
  }

  const terminalValue = (lastFcf * (1 + terminalGrowth)) / (wacc - terminalGrowth);
  const discountedTerminalValue = terminalValue / Math.pow(1 + wacc, 5);
  const enterpriseValue = sumDiscounted + discountedTerminalValue;
  const equityValue = enterpriseValue - total_debt + cash;
  return equityValue / shares_outstanding;
}

function DcfCard({ dcf, currentPrice }: { dcf: any; currentPrice: number | null }) {
  const [growthRate, setGrowthRate] = useState(dcf?.starting_growth_rate ?? 0.05);
  const [wacc, setWacc] = useState(dcf?.wacc_used ?? 0.09);

  if (!dcf) return null;

  const liveValue = calculateDcfLive(dcf.inputs, growthRate, wacc, dcf.terminal_growth_used);
  const diffPct = currentPrice ? ((liveValue - currentPrice) / currentPrice) * 100 : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900 text-[15px]">
          <i className="ti ti-calculator mr-1.5" style={{ color: ACCENT }}></i>
          Discounted Cash Flow (DCF)
        </h3>
        <span className="text-xs text-gray-400 font-medium">not included in score</span>
      </div>

      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-xs text-gray-500 mb-1">Estimated Fair Value</p>
          <p
            className="text-4xl font-bold"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ${liveValue.toFixed(2)}
          </p>
        </div>
        {currentPrice && (
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Current Price</p>
            <p className="text-2xl font-semibold text-gray-700">${currentPrice.toFixed(2)}</p>
            {diffPct !== null && (
              <p className={`text-sm font-medium flex items-center justify-end gap-1 ${diffPct >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                <i className={`ti ${diffPct >= 0 ? "ti-arrow-up" : "ti-arrow-down"}`}></i>
                {diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}% vs. fair value
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600">Starting Growth Rate</span>
            <span className="font-semibold text-gray-900">{(growthRate * 100).toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="-10"
            max="30"
            step="0.5"
            value={growthRate * 100}
            onChange={(e) => setGrowthRate(Number(e.target.value) / 100)}
            className="w-full accent-[#2d5a96]"
          />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600">Discount Rate (WACC)</span>
            <span className="font-semibold text-gray-900">{(wacc * 100).toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="4"
            max="18"
            step="0.25"
            value={wacc * 100}
            onChange={(e) => setWacc(Number(e.target.value) / 100)}
            className="w-full accent-[#2d5a96]"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-5 pt-3 border-t border-gray-100">
        Our default assumptions blend historical growth, revenue/earnings trends, and analyst estimates. Adjust the sliders above to see how your own view of growth and risk changes the estimated fair value. A DCF is highly sensitive to these assumptions — this is one lens on value, not a prediction.
      </p>
    </div>
  );
}

// ---------- Hero score card ----------

function HeroScoreCard({ stockData }: { stockData: any }) {
  const score = stockData.scoring.overall.overall_score;
  const rating = stockData.scoring.overall.rating;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-8 mb-6 border-l-[5px]"
      style={{
        background: "linear-gradient(135deg, #f8f7f5 0%, #f0ede8 100%)",
        borderLeftColor: ACCENT,
      }}
    >
      <div
        className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(45,90,150,0.08), transparent)" }}
      />
      <div className="relative z-10 flex items-start justify-between flex-wrap gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-gray-500 text-sm font-semibold">{stockData.ticker}</p>
            {stockData.data_source && stockData.data_source !== "FMP" && (
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                via {stockData.data_source}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[11px] uppercase tracking-wide font-semibold mb-2">Investment Score</p>
          <p
            className="text-6xl font-bold leading-none"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {score}
          </p>
        </div>
        <div className="bg-white rounded-xl px-6 py-4 border border-gray-200 text-center min-w-[140px]">
          <p className="text-gray-400 text-[11px] uppercase tracking-wide font-semibold mb-2">Rating</p>
          <p className={`text-2xl font-bold ${ratingColor(rating)}`}>{rating}</p>
        </div>
      </div>
    </div>
  );
}

// ---------- Main page ----------

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
    <main className="min-h-screen bg-[#fafaf8] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Investment Research Platform</h1>
          <p className="text-gray-500 text-sm">Rules-based fundamental analysis for any public stock</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Try AAPL, MSFT, TSLA..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#2d5a96]/40 focus:border-[#2d5a96] transition-all"
            />
            <button
              onClick={handleSearch}
              className="text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
            >
              <i className="ti ti-search mr-1.5"></i>
              Search
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#2d5a96] rounded-full animate-spin" />
            Loading...
          </div>
        )}

        {stockData && stockData.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
            {stockData.error}
          </div>
        )}

        {stockData && !stockData.error && (
          <div>
            <HeroScoreCard stockData={stockData} />

            {stockData.data_notes && stockData.data_notes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm mb-6">
                {stockData.data_notes.map((note: string, i: number) => (
                  <p key={i}>{note}</p>
                ))}
              </div>
            )}

            <ValuationCard valuation={stockData.valuation} />
            <AnalystConsensusCard consensus={stockData.analyst_consensus} />
            <DcfCard dcf={stockData.dcf} currentPrice={stockData.valuation?.price} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <CategoryCard
                title="Profitability"
                weight="35% of score"
                maxScore={35}
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
                weight="25% of score"
                maxScore={25}
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
                weight="15% of score"
                maxScore={15}
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
                weight="25% of score"
                maxScore={25}
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

            {stockData.memo && <MemoCard memo={stockData.memo} />}

            <SentimentCard bullish={stockData.bullish_themes || []} bearish={stockData.bearish_themes || []} />
          </div>
        )}
      </div>
    </main>
  );
}