"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState<"profile" | "wallet" | "api">("wallet");
  const [pk, setPk] = useState("");
  const [sk, setSk] = useState("");

  // Load local wallet on mount
  useEffect(() => {
    setPk(localStorage.getItem("zing_pubkey") || "");
    setSk(localStorage.getItem("zing_secret") || "");
  }, []);

  function handleSaveWallet(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("zing_pubkey", pk);
    localStorage.setItem("zing_secret", sk);
    alert("Wallet saved locally. Keys never touch the server.");
    window.location.reload();
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#F4F4F5", marginBottom: "32px" }}>
        Settings
      </h1>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        {/* Sidebar tabs */}
        <div style={{ width: "200px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            { id: "wallet", label: "Stellar Wallet" },
            { id: "profile", label: "User Profile" },
            { id: "api", label: "Agent API Keys" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: "10px 16px",
                textAlign: "left",
                background: activeTab === t.id ? "#27272A" : "transparent",
                color: activeTab === t.id ? "#F4F4F5" : "#71717A",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: activeTab === t.id ? 500 : 400,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, background: "#111113", border: "1px solid #27272A", borderRadius: "8px", padding: "24px" }}>
          {activeTab === "wallet" && (
            <form onSubmit={handleSaveWallet}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#F4F4F5", marginBottom: "8px" }}>
                Connect Stellar Account
              </h2>
              <p style={{ fontSize: "13px", color: "#71717A", marginBottom: "24px", lineHeight: 1.5 }}>
                Zing is non-custodial. Enter your Stellar Testnet keys below. 
                They are stored ONLY in your browser&apos;s localStorage and never sent to our servers.
              </p>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Public Key</label>
                <input
                  value={pk}
                  onChange={(e) => setPk(e.target.value)}
                  placeholder="G..."
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Secret Key (S...)</label>
                <input
                  type="password"
                  value={sk}
                  onChange={(e) => setSk(e.target.value)}
                  placeholder="S..."
                  style={inputStyle}
                  required
                />
              </div>

              <button type="submit" style={btnStyle}>Save Wallet Locally</button>
            </form>
          )}

          {activeTab === "profile" && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#F4F4F5", marginBottom: "8px" }}>
                User Profile
              </h2>
              <p style={{ fontSize: "13px", color: "#71717A", marginBottom: "24px" }}>
                Manage your public Zing profile (saved to Supabase).
              </p>
              
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Display Name</label>
                <input placeholder="Anon Trader" style={inputStyle} />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Avatar URL</label>
                <input placeholder="https://..." style={inputStyle} />
              </div>

              <button style={btnStyle}>Update Profile</button>
            </div>
          )}

          {activeTab === "api" && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#F4F4F5", marginBottom: "8px" }}>
                Agent API Keys
              </h2>
              <p style={{ fontSize: "13px", color: "#71717A", marginBottom: "24px", lineHeight: 1.5 }}>
                Generate API keys for your AI agents to interact with the Zing Intents API (Phase 7).
              </p>

              <div
                style={{
                  padding: "16px",
                  background: "#18181B",
                  border: "1px dashed #3F3F46",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "13px", color: "#52525B", marginBottom: "12px" }}>
                  No API keys generated yet.
                </p>
                <button
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    border: "1px solid #3F3F46",
                    color: "#F4F4F5",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  + Generate New Key
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  color: "#71717A",
  marginBottom: "6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#18181B",
  border: "1px solid #27272A",
  borderRadius: "6px",
  color: "#F4F4F5",
  fontSize: "13px",
  outline: "none",
  fontFamily: "var(--font-geist-mono)",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 24px",
  background: "#F59E0B",
  color: "#09090B",
  border: "none",
  borderRadius: "6px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};
