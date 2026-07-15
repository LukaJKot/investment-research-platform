"use client";

import { useState } from "react";

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setStockData(null);
    const response = await fetch(`http://127.0.0.1:8000/stock/${ticker}`);
    const data = await response.json();
    setStockData(data);
    setLoading(false);
  };

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Investment Research Platform</h1>

      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        placeholder="Enter ticker (e.g. AAPL)"
        style={{ padding: "8px", fontSize: "16px", marginRight: "8px" }}
      />
      <button onClick={handleSearch} style={{ padding: "8px 16px", fontSize: "16px" }}>
        Search
      </button>

      {loading && <p>Loading...</p>}

      {stockData && stockData.error && (
        <p style={{ color: "red", marginTop: "20px" }}>{stockData.error}</p>
      )}

      {stockData && !stockData.error && (
        <pre style={{ marginTop: "20px", background: "#f4f4f4", padding: "16px" }}>
          {JSON.stringify(stockData.scoring, null, 2)}
        </pre>
      )}
    </main>
  );
}