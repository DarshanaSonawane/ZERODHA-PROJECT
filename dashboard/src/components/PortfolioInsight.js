import React, { useState } from "react";

import api from "./api";

const PortfolioInsight = () => {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);
  const [cached, setCached] = useState(null);

  async function generate() {
    // If an insight is already shown this click is "Regenerate",
    // which bypasses the server-side cache via ?force=true
    const isRegenerate = Boolean(insight);

    setLoading(true);
    setError("");
    setInsight("");
    setCached(null);
    try {
      const res = await api.post(
        isRegenerate ? "/portfolio-insight?force=true" : "/portfolio-insight"
      );
      setInsight(res.data.insight);
      setGeneratedAt(res.data.generatedAt);
      setCached(Boolean(res.data.cached));
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate insight");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="insight-card">
      <div className="insight-inner">
        <div className="insight-head">
          <span className="insight-badge">✨ AI</span>
          <h4>Portfolio Insight</h4>
          <button
            type="button"
            className="insight-btn"
            onClick={generate}
            disabled={loading}
          >
            {loading ? "Analyzing…" : insight ? "Regenerate" : "Generate Insight"}
          </button>
        </div>

        {loading && (
          <p className="insight-loading">
            Analyzing your holdings
            <span className="dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        )}

        {error && <p className="insight-error">{error}</p>}

        {!loading && insight && <p className="insight-text">{insight}</p>}

        {!loading && generatedAt && !error && (
          <p className="insight-meta">
            Generated at {new Date(generatedAt).toLocaleTimeString()}
            {cached ? " · served from cache" : ""} · neutral summary, not
            financial advice
          </p>
        )}
      </div>
    </div>
  );
};

export default PortfolioInsight;
