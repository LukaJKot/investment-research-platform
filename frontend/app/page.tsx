"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((response) => response.json())
      .then((data) => setMessage(data.message));
  }, []);

  return (
    <main style={{ padding: "40px", fontSize: "24px" }}>
      <h1>{message}</h1>
    </main>
  );
}
