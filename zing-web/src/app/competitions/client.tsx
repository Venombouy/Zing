"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Competition {
  id: string;
  asset_tracked: string;
  time_window_start: string;
  time_window_end: string;
  reward_tiers: Array<{ tierName: string; allocationPercent: number }> | null;
  scoring_weights: Record<string, number> | null;
  created_at: string;
}

interface Entry {
  competition_id: string;
  user_id: string;
  score: number;
  rank: number | null;
  reward_distribution: number | null;
}

interface Props {
  competitions: Competition[];
  entries: Entry[];
  dbError: string | null;
}

function now() { return Date.now(); }

function CompetitionCard({ c, entries }: { c: Competition; entries: Entry[] }) {
  const start     = new Date(c.time_window_start).getTime();
  const end       = new Date(c.time_window_end).getTime();
  const nowMs     = now();
  const isLive    = nowMs >= start && nowMs < end;
  const isEnded   = nowMs >= end;
  const topEntries = entries.slice(0, 3);

  return (
    <div
      style={{
        border: "1px solid #27272A",
        borderRadius: "8px",
        padding: "20px",
        background: "#111113",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#F4F4F5", marginBottom: "2px" }}>
            {c.asset_tracked}
          </div>
          <div style={{ fontSize: "11px", color: "#52525B" }}>
            {new Date(c.time_window_start).toLocaleDateString()} →{" "}
            {new Date(c.time_window_end).toLocaleDateString()}
          </div>
        </div>
        <span
          className={`tag ${isLive ? "tag-live" : isEnded ? "tag-pending" : ""}`}
          style={!isLive && !isEnded ? {
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            background: "#1E1B4B",
            color: "#818CF8",
            border: "1px solid #312E81",
          } : undefined}
        >
          {isLive ? "Live" : isEnded ? "Ended" : "Upcoming"}
        </span>
      </div>

      {/* Reward tiers */}
      {c.reward_tiers && c.reward_tiers.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <div className="stat-label" style={{ marginBottom: "6px" }}>Reward Tiers</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {c.reward_tiers.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: "4px 10px",
                  background: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: "5px",
                  fontSize: "11px",
                  color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : "#B45309",
                  fontWeight: 600,
                }}
              >
                {t.tierName.toUpperCase()} {t.allocationPercent}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoring signals */}
      {c.scoring_weights && Object.keys(c.scoring_weights).length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <div className="stat-label" style={{ marginBottom: "6px" }}>Scoring Signals</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {Object.entries(c.scoring_weights).map(([k, v]) => (
              <span
                key={k}
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  background: "#18181B",
                  borderRadius: "3px",
                  color: "#71717A",
                  border: "1px solid #27272A",
                }}
              >
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {topEntries.length > 0 ? (
        <div style={{ borderTop: "1px solid #27272A", paddingTop: "12px" }}>
          <div className="stat-label" style={{ marginBottom: "8px" }}>Leaderboard (top 3)</div>
          {topEntries.map((e, i) => (
            <div
              key={e.user_id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 0",
                borderBottom: i < topEntries.length - 1 ? "1px solid #18181B" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : "#B45309",
                    width: "16px",
                  }}
                >
                  #{e.rank ?? i + 1}
                </span>
                <span className="price" style={{ fontSize: "11px", color: "#71717A" }}>
                  {e.user_id.slice(0, 8)}…
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="price" style={{ fontSize: "12px", color: "#F4F4F5", marginRight: "12px" }}>
                  Score: {e.score.toFixed(2)}
                </span>
                {e.reward_distribution && (
                  <span className="price" style={{ fontSize: "11px", color: "#22C55E" }}>
                    +{e.reward_distribution}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ borderTop: "1px solid #27272A", paddingTop: "12px", fontSize: "12px", color: "#52525B" }}>
          No entries yet. Scoring runs via Soroban contract{" "}
          <span className="tag tag-pending">pending</span>.
        </div>
      )}
    </div>
  );
}

export default function CompetitionsClient({ competitions, entries, dbError }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [asset, setAsset]   = useState("XLM/USDC");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [tiers, setTiers] = useState([
    { tierName: "gold",   allocationPercent: 60 },
    { tierName: "silver", allocationPercent: 25 },
    { tierName: "bronze", allocationPercent: 15 },
  ]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase.from("competitions").insert({
      asset_tracked:      asset,
      time_window_start:  new Date(startDate).toISOString(),
      time_window_end:    new Date(endDate).toISOString(),
      reward_tiers:       tiers,
      scoring_weights:    {
        liquidityQuality:           0.3,
        tradeTiming:                0.2,
        riskAdjustedReturn:         0.35,
        priceDiscoveryContribution: 0.15,
      },
    });

    setSaving(false);

    if (error) {
      setSaveMsg({ type: "err", text: `DB error: ${error.message}` });
    } else {
      setSaveMsg({
        type: "ok",
        text: "Competition saved to Supabase. On-chain scoring via Soroban Competition contract is PENDING — no XDR submitted.",
      });
      setTimeout(() => window.location.reload(), 1400);
    }
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#F4F4F5", marginBottom: "4px" }}>
            Trading Competitions
          </h1>
          <p style={{ fontSize: "13px", color: "#71717A", maxWidth: "540px", lineHeight: 1.5 }}>
            Skill-based, fully transparent trading contests on Stellar DEX.
            Scoring signals: liquidity quality, trade timing, risk-adjusted return, price discovery.
            On-chain settlement via Soroban <span className="tag tag-pending">pending deployment</span>.
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
          {showForm ? "Cancel" : "New Competition"}
        </button>
      </div>

      {dbError && (
        <div style={{ marginBottom: "24px", padding: "12px 16px", background: "#7F1D1D", borderRadius: "6px", fontSize: "12px", color: "#FCA5A5" }}>
          Supabase error: {dbError}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            border: "1px solid #27272A",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "32px",
            background: "#111113",
          }}
        >
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#F4F4F5", marginBottom: "20px" }}>
            Competition Setup
            <span style={{ fontSize: "11px", color: "#52525B", marginLeft: "8px", fontWeight: 400 }}>
              Zing Doc §9.2
            </span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Asset Tracked</label>
              <input
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="e.g. XLM/USDC"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Start Date (UTC)</label>
              <input
                required
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date (UTC)</label>
              <input
                required
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Tiers */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Reward Tiers (must total 100%)</label>
            <div style={{ display: "flex", gap: "12px" }}>
              {tiers.map((t, i) => (
                <div key={t.tierName} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#71717A", textTransform: "capitalize" }}>{t.tierName}:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={t.allocationPercent}
                    onChange={(ev) => {
                      const next = [...tiers];
                      next[i] = { ...next[i], allocationPercent: parseInt(ev.target.value) || 0 };
                      setTiers(next);
                    }}
                    style={{ ...inputStyle, width: "64px", textAlign: "right", fontFamily: "var(--font-geist-mono)" }}
                  />
                  <span style={{ fontSize: "12px", color: "#52525B" }}>%</span>
                </div>
              ))}
              <span style={{ fontSize: "12px", color: tiers.reduce((s, t) => s + t.allocationPercent, 0) === 100 ? "#22C55E" : "#EF4444", alignSelf: "center", fontFamily: "var(--font-geist-mono)" }}>
                = {tiers.reduce((s, t) => s + t.allocationPercent, 0)}%
              </span>
            </div>
          </div>

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
            <strong style={{ color: "#A8A29E" }}>Note:</strong> Scoring weights are pre-filled from Zing Doc §9.3 signal list.
            Exact formula weights are an <strong>OPEN QUESTION</strong> (flagged in Phase 0).
            Competition saved to Supabase only — Soroban contract{" "}
            <span className="tag tag-pending">pending</span>.
          </div>

          <button
            type="submit"
            disabled={saving || tiers.reduce((s, t) => s + t.allocationPercent, 0) !== 100}
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
            {saving ? "Saving…" : "Create Competition"}
          </button>

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

      {/* Competition list */}
      {competitions.length === 0 ? (
        <div
          style={{
            padding: "64px 20px",
            textAlign: "center",
            color: "#52525B",
            border: "1px solid #27272A",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "15px", marginBottom: "8px", color: "#71717A" }}>No competitions yet</div>
          <div style={{ fontSize: "13px" }}>Launch the first trading competition on Stellar DEX.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          {competitions.map((c) => (
            <CompetitionCard
              key={c.id}
              c={c}
              entries={entries.filter((e) => e.competition_id === c.id)}
            />
          ))}
        </div>
      )}
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
};
