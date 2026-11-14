import React, { useState } from "react";

const API_URL = "http://localhost:8000";

const attacks = [
  {
    type: "micro_split",
    name: "Micro-Split Attack",
    description: "Multiple small transactions to avoid detection."
  },
  {
    type: "device_takeover",
    name: "Device Takeover",
    description: "Transaction from an unknown device."
  },
  {
    type: "fan_in",
    name: "Fan-In / Rapid-Hop",
    description: "Multiple senders and rapid onward transfers."
  },
  {
    type: "coercion",
    name: "Coercion Attack",
    description: "Suspicious call or screen-sharing signals."
  }
];

export default function AttackBar() {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  const triggerAttack = async (type) => {
    setLoading(type);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/simulator/attack/${type}`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Attack could not be triggered");
      }

      setMessage(data.message || `${type} attack triggered successfully.`);
    } catch (error) {
      setMessage(error.message || "Unable to connect to backend.");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="attack-panel">
      <h2>Fraud Attack Simulator</h2>
      <p>Choose an attack scenario to test ShieldPay.</p>

      <div className="attack-grid">
        {attacks.map((attack) => (
          <div className="attack-card" key={attack.type}>
            <h3>{attack.name}</h3>
            <p>{attack.description}</p>

            <button
              onClick={() => triggerAttack(attack.type)}
              disabled={loading !== ""}
            >
              {loading === attack.type ? "Simulating..." : "Simulate Attack"}
            </button>
          </div>
        ))}
      </div>

      {message && <p className="attack-message">{message}</p>}
    </div>
  );
}
