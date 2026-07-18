"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Campaign {
  id: string;
  project_id: string | null;
  reward_pool_amount: number;
  rules: Record<string, unknown> | null;
  quests: Array<{ questType: string; targetUrl: string; rewardPerCompletion: string }> | null;
  scoring_weights: Record<string, number> | null;
  payout_logic: Record<string, unknown> | null;
  fee_model: Record<string, unknown> | null;
  created_at: string;
  projects: { name: string; symbol: string } | null;
}

interface EventCount {
  campaign_id: string;
  status: string;
}

interface Props {
  campaigns: Campaign[];
  eventCounts: EventCount[];
  dbError: string | null;
}

function CampaignCard({ c, events }: { c: Campaign; events: EventCount[] }) {
  const approved = events.filter((e) => e.status === "approved").length;
  const submitted = events.filter((e) => e.status === "submitted").length;
  const rejected  = events.filter((e) => e.status === "rejected").length;

  return (
    <div
      style={{
        border: "1px solid #27272A",
        borderRadius: "8px",
        padding: "20px",
        background: "#111113",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          {c.projects ? (
            <span style={{ fontWeight: 600, fontSize: "14px", color: "#F4F4F5" }}>
              {c.projects.name} <span style={{ color: "#52525B" }}>${c.projects.symbol}</span>
            </span>
          ) : (
            <span style={{ fontSize: "12px", color: "#52525B" }}>Project ID: {c.project_id?.slice(0, 8)}…</span>
          )}
        </div>
        <span style={{ fontSize: "11px", color: "#52525B" }}>
          {new Date(c.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Reward pool */}
      <div style={{ marginBottom: "12px" }}>
        <div className="stat-label" style={{ marginBottom: "2px" }}>Reward Pool</div>
        <div className="price" style={{ fontSize: "18px", fontWeight: 700, color: "#F59E0B" }}>
          {c.reward_pool_amount.toLocaleString()}
        </div>
        <div style={{ fontSize: "11px", color: "#52525B" }}>
          Platform fee: {(c.fee_model as { platformFeePercent?: number })?.platformFeePercent ?? 5}% ·
          Payout: Soroban contract <span className="tag tag-pending">pending</span>
        </div>
      </div>

      {/* Quests */}
      {c.quests && c.quests.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div className="stat-label" style={{ marginBottom: "6px" }}>Quests</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {c.quests.map((q, i) => (
              <span
                key={i}
                style={{
                  fontSize: "11px",
                  padding: "3px 8px",
                  background: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: "4px",
                  color: "#71717A",
                  textTransform: "capitalize",
                }}
              >
                {q.questType}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Event stats */}
      <div style={{ display: "flex", gap: "16px", paddingTop: "12px", borderTop: "1px solid #27272A" }}>
        {[
          { label: "Approved", value: approved, color: "#22C55E" },
          { label: "Pending",  value: submitted, color: "#F59E0B" },
          { label: "Rejected", value: rejected,  color: "#EF4444" },
        ].map((s) => (
          <div key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="price" style={{ fontSize: "16px", fontWeight: 600, color: s.value > 0 ? s.color : "#3F3F46" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SocialBoosterClient({ campaigns, eventCounts, dbError }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form state
  const [projectId, setProjectId]   = useState("");
  const [poolAmount, setPoolAmount] = useState("");
  const [feePercent, setFeePercent] = useState("5");
  const [quests, setQuests]         = useState<string[]>([]);

  const QUEST_TYPES = ["follow", "post", "join_group"];

  function toggleQuest(q: string) {
    setQuests((prev) => prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!poolAmount || parseFloat(poolAmount) <= 0) return;

    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase.from("campaigns").insert({
      project_id:       projectId || null,
      reward_pool_amount: parseFloat(poolAmount),
      rules:            {},
      quests:           quests.map((q) => ({ questType: q, targetUrl: "", rewardPerCompletion: "0" })),
      scoring_weights:  {},
      payout_logic:     {},
      fee_model:        { platformFeePercent: parseFloat(feePercent) },
    });

    setSaving(false);

    if (error) {
      setSaveMsg({ type: "err", text: `DB error: ${error.message}` });
    } else {
      setSaveMsg({
        type: "ok",
        text: "Campaign created in Supabase. Reward pool deposit and scoring engine are PENDING — Soroban contract not yet deployed.",
      });
      setProjectId(""); setPoolAmount(""); setQuests([]);
      setTimeout(() => window.location.reload(), 1400);
    }
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#F4F4F5", marginBottom: "4px" }}>
            Social Booster
          </h1>
          <p style={{ fontSize: "13px", color: "#71717A", maxWidth: "540px", lineHeight: 1.5 }}>
            Create KOL and community campaigns with Stellar-native reward pools.
            AI scoring pipeline evaluates post quality. Payouts settle via Soroban contract{" "}
            <span className="tag tag-pending">pending deployment</span>.
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
          {showForm ? "Cancel" : "New Campaign"}
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
            Campaign Setup
            <span style={{ fontSize: "11px", color: "#52525B", marginLeft: "8px", fontWeight: 400 }}>
              Zing Doc §8.2–8.3
            </span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Project ID (optional — from LaunchPad)</label>
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="UUID from projects table"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Reward Pool Amount (XLM/USDC)</label>
              <input
                required
                type="number"
                min="1"
                value={poolAmount}
                onChange={(e) => setPoolAmount(e.target.value)}
                placeholder="e.g. 10000"
                style={{ ...inputStyle, fontFamily: "var(--font-geist-mono)" }}
              />
            </div>
          </div>

          {/* Platform fee */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Platform Fee %</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["3", "5", "10"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeePercent(f)}
                  style={{
                    padding: "6px 12px",
                    background: feePercent === f ? "#27272A" : "transparent",
                    border: `1px solid ${feePercent === f ? "#3F3F46" : "#27272A"}`,
                    borderRadius: "5px",
                    color: feePercent === f ? "#F4F4F5" : "#71717A",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {f}%
                </button>
              ))}
            </div>
          </div>

          {/* Quests */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Quests (Zing Doc §8.2)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {QUEST_TYPES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => toggleQuest(q)}
                  style={{
                    padding: "6px 12px",
                    background: quests.includes(q) ? "#92400E" : "transparent",
                    border: `1px solid ${quests.includes(q) ? "#F59E0B" : "#27272A"}`,
                    borderRadius: "5px",
                    color: quests.includes(q) ? "#FCD34D" : "#71717A",
                    fontSize: "12px",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {q.replace("_", " ")}
                </button>
              ))}
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
            <strong style={{ color: "#A8A29E" }}>Note:</strong> Campaign is saved to Supabase.
            Reward pool deposit, AI scoring, and payout settlement via Soroban are{" "}
            <span className="tag tag-pending">pending</span>.
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
              {saving ? "Saving…" : "Create Campaign"}
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

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div
          style={{
            padding: "64px 20px",
            textAlign: "center",
            color: "#52525B",
            border: "1px solid #27272A",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "15px", marginBottom: "8px", color: "#71717A" }}>No campaigns yet</div>
          <div style={{ fontSize: "13px" }}>Start a Social Booster campaign to grow your project on Stellar.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              c={c}
              events={eventCounts.filter((e) => e.campaign_id === c.id)}
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
