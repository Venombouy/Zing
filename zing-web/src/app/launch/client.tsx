"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Project {
  id: string;
  name: string;
  symbol: string;
  category: string | null;
  deployment_type: string | null;
  created_at: string;
}

interface Props {
  projects: Project[];
  dbError: string | null;
}

type Category     = "meme" | "AI" | "DeFi" | "RWA" | "gaming" | "other";
type DeployType   = "stellar-only" | "stellar-plus-evm" | "stellar-plus-solana";

const CATEGORIES: Category[]   = ["meme", "AI", "DeFi", "RWA", "gaming", "other"];
const DEPLOY_TYPES: DeployType[] = ["stellar-only", "stellar-plus-evm", "stellar-plus-solana"];

const CATEGORY_LABELS: Record<string, string> = {
  "stellar-only":         "Stellar Only",
  "stellar-plus-evm":     "Stellar + EVM (via Axelar — Phase 5)",
  "stellar-plus-solana":  "Stellar + Solana (via Axelar — Phase 5)",
};

function ProjectRow({ p }: { p: Project }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 80px 120px 150px 120px",
        padding: "12px 20px",
        borderBottom: "1px solid #18181B",
        alignItems: "center",
        fontSize: "13px",
      }}
    >
      <div>
        <span style={{ fontWeight: 600, color: "#F4F4F5" }}>{p.name}</span>
        <span style={{ color: "#52525B", marginLeft: "6px" }}>${p.symbol}</span>
      </div>
      <span
        style={{
          fontSize: "10px",
          padding: "2px 6px",
          background: "#27272A",
          borderRadius: "4px",
          color: "#71717A",
          textTransform: "uppercase",
        }}
      >
        {p.category ?? "—"}
      </span>
      <span style={{ color: "#71717A", fontSize: "12px" }}>
        {p.deployment_type ?? "—"}
      </span>
      <span style={{ color: "#52525B", fontSize: "11px" }}>
        {new Date(p.created_at).toLocaleDateString()}
      </span>
      {/* Contract status — all pending per Phase 3 */}
      <span className="tag tag-pending">Contract pending</span>
    </div>
  );
}

export default function LaunchPadClient({ projects, dbError }: Props) {
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form state — all fields from Zing Doc §7.3
  const [name, setName]               = useState("");
  const [symbol, setSymbol]           = useState("");
  const [supply, setSupply]           = useState("");
  const [category, setCategory]       = useState<Category>("meme");
  const [deployType, setDeployType]   = useState<DeployType>("stellar-only");
  const [description, setDescription] = useState("");

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !symbol.trim() || !supply) return;

    setSaving(true);
    setSaveMsg(null);

    // Insert into Supabase projects table (schema from Phase 1 migration)
    const { error } = await supabase.from("projects").insert({
      name:            name.trim(),
      symbol:          symbol.trim().toUpperCase(),
      supply:          parseFloat(supply),
      category,
      deployment_type: deployType,
      metadata:        { description: description.trim() },
    });

    setSaving(false);

    if (error) {
      setSaveMsg({ type: "err", text: `Database error: ${error.message}` });
    } else {
      setSaveMsg({ type: "ok", text: "Project created and saved to Supabase. Soroban contract deployment is PENDING — no on-chain action executed yet." });
      setName(""); setSymbol(""); setSupply(""); setDescription("");
      setShowForm(false);
      // Reload
      setTimeout(() => window.location.reload(), 1200);
    }
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#F4F4F5", marginBottom: "4px" }}>LaunchPad</h1>
          <p style={{ fontSize: "13px", color: "#71717A", maxWidth: "520px", lineHeight: 1.5 }}>
            Launch Stellar assets, Soroban tokens, and AI-agent tokens. Liquidity configuration and on-chain minting requires Soroban contracts —{" "}
            <span className="tag tag-pending" style={{ verticalAlign: "middle" }}>contract deployment pending</span>.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            padding: "9px 18px",
            background: "#F59E0B",
            color: "#09090B",
            border: "none",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {showForm ? "Cancel" : "New Launch"}
        </button>
      </div>

      {/* DB error */}
      {dbError && (
        <div style={{ marginBottom: "24px", padding: "12px 16px", background: "#7F1D1D", borderRadius: "6px", fontSize: "12px", color: "#FCA5A5" }}>
          Supabase error: {dbError}
        </div>
      )}

      {/* Launch form */}
      {showForm && (
        <form
          onSubmit={handleLaunch}
          style={{
            border: "1px solid #27272A",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "32px",
            background: "#111113",
          }}
        >
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#F4F4F5", marginBottom: "20px" }}>
            Define Asset
            <span style={{ fontSize: "11px", color: "#52525B", marginLeft: "8px", fontWeight: 400 }}>
              per Zing Doc §7.3
            </span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            {/* Name */}
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#71717A", marginBottom: "6px", textTransform: "uppercase" }}>
                Token Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zing Token"
                style={inputStyle}
              />
            </div>

            {/* Symbol */}
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#71717A", marginBottom: "6px", textTransform: "uppercase" }}>
                Symbol (4–12 chars) *
              </label>
              <input
                required
                maxLength={12}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. ZING"
                style={{ ...inputStyle, fontFamily: "var(--font-geist-mono)" }}
              />
            </div>

            {/* Supply */}
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#71717A", marginBottom: "6px", textTransform: "uppercase" }}>
                Total Supply *
              </label>
              <input
                required
                type="number"
                min="1"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                placeholder="e.g. 1000000000"
                style={{ ...inputStyle, fontFamily: "var(--font-geist-mono)" }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#71717A", marginBottom: "6px", textTransform: "uppercase" }}>
                Category
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Deployment type */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#71717A", marginBottom: "8px", textTransform: "uppercase" }}>
              Deployment
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {DEPLOY_TYPES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeployType(d)}
                  style={{
                    padding: "7px 12px",
                    background: deployType === d ? "#27272A" : "transparent",
                    border: `1px solid ${deployType === d ? "#3F3F46" : "#27272A"}`,
                    borderRadius: "6px",
                    color: deployType === d ? "#F4F4F5" : "#71717A",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {CATEGORY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#71717A", marginBottom: "6px", textTransform: "uppercase" }}>
              Description (max 256 chars)
            </label>
            <textarea
              maxLength={256}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project and its purpose"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Notice */}
          <div
            style={{
              padding: "10px 14px",
              background: "#1C1917",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#78716C",
              marginBottom: "16px",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "#A8A29E" }}>Note:</strong> This creates a project record in Supabase. Actual on-chain token minting (Soroban Launchpad contract) is{" "}
            <span className="tag tag-pending">pending deployment</span>. No XDR will be submitted.
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 24px",
                background: saving ? "#3F3F46" : "#F59E0B",
                color: saving ? "#71717A" : "#09090B",
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Create Project"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ padding: "10px 16px", background: "transparent", border: "1px solid #27272A", borderRadius: "6px", color: "#71717A", fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>

          {saveMsg && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                background: saveMsg.type === "ok" ? "#14532D" : "#7F1D1D",
                borderRadius: "6px",
                fontSize: "12px",
                color: saveMsg.type === "ok" ? "#4ADE80" : "#FCA5A5",
                lineHeight: 1.5,
              }}
            >
              {saveMsg.text}
            </div>
          )}
        </form>
      )}

      {/* Projects table */}
      <div style={{ border: "1px solid #27272A", borderRadius: "8px", overflow: "hidden" }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 120px 150px 120px",
            padding: "10px 20px",
            borderBottom: "1px solid #27272A",
            background: "#111113",
            fontSize: "10px",
            color: "#52525B",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <span>Asset</span>
          <span>Category</span>
          <span>Deployment</span>
          <span>Created</span>
          <span>Contract</span>
        </div>

        {projects.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#52525B", fontSize: "13px" }}>
            No projects yet. Launch the first one.
          </div>
        ) : (
          projects.map((p) => <ProjectRow key={p.id} p={p} />)
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#18181B",
  border: "1px solid #27272A",
  borderRadius: "6px",
  color: "#F4F4F5",
  fontSize: "13px",
  outline: "none",
};
