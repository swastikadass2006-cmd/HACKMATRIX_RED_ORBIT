import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

export default function ScamWarning({ transactionId }) {
  const [language, setLanguage] = useState("en");
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transactionId) {
      setWarning(null);
      return;
    }

    const controller = new AbortController();

    const fetchAdvice = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/ai/advice/${encodeURIComponent(transactionId)}?lang=${language}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Unable to fetch AI advice");
        }

        setWarning(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setWarning(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAdvice();

    return () => controller.abort();
  }, [transactionId, language]);

  if (!transactionId) {
    return (
      <div className="scam-warning">
        <h3>AI Scam Coach</h3>
        <p>Select a transaction to view its safety advice.</p>
      </div>
    );
  }

  return (
    <div className="scam-warning">
      <div className="warning-header">
        <h2>🛡️ AI Scam Coach</h2>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="bn">Bengali</option>
        </select>
      </div>

      {loading && <p>Generating safety advice...</p>}

      {error && <p className="warning-error">{error}</p>}

      {warning && (
        <>
          <h3>{warning.headline}</h3>
          <p>{warning.message}</p>

          <h4>What should you do?</h4>

          <ul>
            {warning.do_this_now?.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>

          <small>Language: {warning.language}</small>
        </>
      )}
    </div>
  );
}
