"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ACCENT = "#2d5a96";
const ACCENT_DARK = "#1d3f66";
const GOLD = "#b8a76d";

function ratingColor(rating: string) {
  if (rating === "Excellent" || rating === "Strong") return "text-emerald-700 bg-emerald-50";
  if (rating === "Average") return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

const RATINGS = ["Excellent", "Strong", "Average", "Weak"];

function formatMarketCap(v: number | null) {
  if (v === null || v === undefined) return "N/A";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
}

export default function Screener() {
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [peMax, setPeMax] = useState("");
  const [revenueGrowthMin, setRevenueGrowthMin] = useState("");
  const [debtToEquityMax, setDebtToEquityMax] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://investment-research-api.onrender.com/screener/sectors")
      .then((res) => res.json())
      .then((data) => setSectors(data.sectors || []))
      .catch(() => setSectors([]));

    fetch("https://investment-research-api.onrender.com/screener/status")
      .then((res) => res.json())
      .then((data) => setLastUpdated(data.last_updated))
      .catch(() => {});
  }, []);

  const toggleRating = (r: string) => {
    setSelectedRatings((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const toggleSector = (s: string) => {
    setSelectedSectors((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams();
    if (selectedRatings.length > 0) params.append("rating", selectedRatings.join(","));
    if (selectedSectors.length > 0) params.append("sector", selectedSectors.join(","));
    if (peMax) params.append("pe_max", peMax);
    if (revenueGrowthMin) params.append("revenue_growth_min", (Number(revenueGrowthMin) / 100).toString());
    if (debtToEquityMax) params.append("debt_to_equity_max", debtToEquityMax);
    params.append("sort_by", sortBy);
    params.append("limit", "100");

    try {
      const res = await fetch(`https://investment-research-api.onrender.com/screener?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setSelectedRatings([]);
    setSelectedSectors([]);
    setPeMax("");
    setRevenueGrowthMin("");
    setDebtToEquityMax("");
    setSortBy("score");
  };

  const activeFilterCount =
    selectedRatings.length + selectedSectors.length + (peMax ? 1 : 0) + (revenueGrowthMin ? 1 : 0) + (debtToEquityMax ? 1 : 0);

  return (
    <main className="min-h-screen bg-[#fafaf8] px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1.5">
          <h1 className="text-3xl font-bold text-gray-900">Stock Screener</h1>
          <Link
            href="/"
            className="text-sm font-medium flex items-center gap-1.5 hover:underline"
            style={{ color: ACCENT }}
          >
            <i className="ti ti-search"></i>
            Research a specific stock
          </Link>
        </div>
        <p className="text-gray-500 text-sm mb-1">
          Filter our rules-based scores to find candidates worth a closer look.
        </p>
        {lastUpdated && (
          <p className="text-gray-400 text-xs mb-8">
            <i className="ti ti-refresh mr-1"></i>
            Scores last updated {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
        {!lastUpdated && <div className="mb-8" />}

        {/* Filter Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          {/* Rating */}
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2.5">Rating</p>
            <div className="flex flex-wrap gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRating(r)}
                  className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition-all ${
                    selectedRatings.includes(r)
                      ? "text-white border-transparent"
                      : "text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    selectedRatings.includes(r)
                      ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }
                      : {}
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Sector */}
          {sectors.length > 0 && (
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2.5">Sector</p>
              <div className="flex flex-wrap gap-2">
                {sectors.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSector(s)}
                    className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition-all ${
                      selectedSectors.includes(s)
                        ? "text-white border-transparent"
                        : "text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                    style={
                      selectedSectors.includes(s)
                        ? { background: `linear-gradient(135deg, ${GOLD}, #9a8a56)` }
                        : {}
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Numeric filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2 block">
                Max P/E Ratio
              </label>
              <input
                type="number"
                value={peMax}
                onChange={(e) => setPeMax(e.target.value)}
                placeholder="e.g. 25"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#2d5a96]/40 focus:border-[#2d5a96] transition-all"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2 block">
                Min Revenue Growth (%)
              </label>
              <input
                type="number"
                value={revenueGrowthMin}
                onChange={(e) => setRevenueGrowthMin(e.target.value)}
                placeholder="e.g. 5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#2d5a96]/40 focus:border-[#2d5a96] transition-all"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2 block">
                Max Debt-to-Equity
              </label>
              <input
                type="number"
                value={debtToEquityMax}
                onChange={(e) => setDebtToEquityMax(e.target.value)}
                placeholder="e.g. 1.5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#2d5a96]/40 focus:border-[#2d5a96] transition-all"
              />
            </div>
          </div>

          {/* Sort + actions */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#2d5a96]/40"
              >
                <option value="score">Score</option>
                <option value="pe_ratio">P/E Ratio</option>
                <option value="revenue_growth">Revenue Growth</option>
                <option value="market_cap">Market Cap</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                  Clear filters
                </button>
              )}
              <button
                onClick={handleSearch}
                className="text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
              >
                <i className="ti ti-filter mr-1.5"></i>
                Search
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#2d5a96] rounded-full animate-spin" />
            Searching...
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <i className="ti ti-mood-empty text-3xl text-gray-300 mb-2 block"></i>
            <p className="text-gray-500 text-sm">No stocks match these filters. Try loosening a constraint.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{results.length} results</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wide">Ticker</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Score</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Rating</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Sector</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide text-right">P/E</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide text-right">Rev Growth</th>
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wide text-right">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((stock) => (
                    <tr key={stock.ticker} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-3">
                        <Link href={`/?ticker=${stock.ticker}`} className="font-semibold hover:underline" style={{ color: ACCENT }}>
                          {stock.ticker}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{stock.score}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ratingColor(stock.rating)}`}>
                          {stock.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{stock.sector || "N/A"}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{stock.pe_ratio ?? "N/A"}</td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {stock.revenue_growth !== null ? `${(stock.revenue_growth * 100).toFixed(1)}%` : "N/A"}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">{formatMarketCap(stock.market_cap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!searched && (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <i className="ti ti-filter-search text-3xl text-gray-300 mb-3 block"></i>
            <p className="text-gray-500 text-sm">Set your filters above, then click Search to find candidates.</p>
          </div>
        )}
      </div>
    </main>
  );
}