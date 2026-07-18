"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchOrderBook, getMidPrice, fmt } from "@/lib/stellar";

interface Props {
  midPrice:          string | null;
  spread:            string | null;
  bestBid:           string | null;
  bestAsk:           string | null;
  obError:           string | null;
  tradeCount:        number;
  projectCount:      number;
  campaignCount:     number;
  competitionCount:  number;
  recentProjects:    Array<{ id: string; name: string; symbol: string; category: string | null; created_at: string }>;
  activeCampaigns:   Array<{ id: string; created_at: string }>;
}

function StatCard({ label, value, sub, href }: { label: string; value: string | number; sub?: string; href?: string }) {
  const inner = (
    <div
      style={{
        padding: "20px",
        background: "#111113",
        border: "1px solid #27272A",
        borderRadius: "8px",
      }}
    >
      <div className="stat-label" style={{ marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "#F4F4F5", fontFamily: "var(--font-geist-mono)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "#52525B", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: "none" }}>
      {inner}
    </Link>
  ) : inner;
}

export default function DashboardClient({
  midPrice,
  spread,
  bestBid,
  bestAsk,
  obError,
  tradeCount,
  projectCount,
  campaignCount,
  competitionCount,
  recentProjects,
  activeCampaigns,
}: Props) {
  const [livePrice, setLivePrice] = useState<string | null>(midPrice);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const ob = await fetchOrderBook(5);
        const p  = getMidPrice(ob);
        if (p) { setLivePrice(p); setLastUpdated(new Date()); }
      } catch { /* keep stale */ }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#F4F4F5", marginBottom: "4px" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#71717A" }}>
          Live Stellar testnet data · Updated {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {/* Horizon error */}
      {obError && (
        <div style={{ marginBottom: "24px", padding: "12px 16px", background: "#7F1D1D", borderRadius: "6px", fontSize: "12px", color: "#FCA5A5" }}>
          Horizon connection error: {obError}
        </div>
      )}

      {/* ── Market snapshot ── */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
          XLM / USDC Market — Stellar Testnet
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          <StatCard
            label="Mid Price (USDC/XLM)"
            value={livePrice ?? "—"}
            sub="Live from Horizon order book"
            href="/trade"
          />
          <StatCard
            label="Best Bid (USDC)"
            value={bestBid ? parseFloat(bestBid).toFixed(7) : "—"}
            sub="Highest buyer price"
          />
          <StatCard
            label="Best Ask (USDC)"
            value={bestAsk ? parseFloat(bestAsk).toFixed(7) : "—"}
            sub="Lowest seller price"
          />
          <StatCard
            label="Spread"
            value={spread ? `${spread}%` : "—"}
            sub="Ask − Bid / Ask"
          />
          <StatCard
            label="Recent Trades (30)"
            value={tradeCount}
            sub="Last fetched from Horizon"
            href="/trade"
          />
        </div>
      </section>

      {/* ── Platform counters ── */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
          Platform Activity — Supabase
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          <StatCard label="Projects Launched" value={projectCount}  sub="From projects table"    href="/launch" />
          <StatCard label="Active Campaigns"  value={campaignCount} sub="From campaigns table"   href="/social-booster" />
          <StatCard label="Competitions"      value={competitionCount} sub="From competitions table" href="/competitions" />
        </div>
      </section>

      {/* Two-column: Recent launches + Active campaigns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* Recent Projects */}
        <div style={{ border: "1px solid #27272A", borderRadius: "8px", overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #27272A",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#F4F4F5" }}>Recent Launches</span>
            <Link href="/launch" style={{ fontSize: "12px", color: "#F59E0B", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <div style={{ padding: "32px 20px", color: "#52525B", fontSize: "13px", textAlign: "center" }}>
              No projects launched yet.{" "}
              <Link href="/launch" style={{ color: "#F59E0B" }}>
                Launch one →
              </Link>
            </div>
          ) : (
            recentProjects.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid #18181B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: "13px", color: "#F4F4F5" }}>{p.name}</span>
                  <span style={{ color: "#52525B", fontSize: "12px", marginLeft: "6px" }}>${p.symbol}</span>
                </div>
                {p.category && (
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
                    {p.category}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Active Campaigns */}
        <div style={{ border: "1px solid #27272A", borderRadius: "8px", overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #27272A",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#F4F4F5" }}>Active Campaigns</span>
            <Link href="/social-booster" style={{ fontSize: "12px", color: "#F59E0B", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {activeCampaigns.length === 0 ? (
            <div style={{ padding: "32px 20px", color: "#52525B", fontSize: "13px", textAlign: "center" }}>
              No campaigns running.{" "}
              <Link href="/social-booster" style={{ color: "#F59E0B" }}>
                Start one →
              </Link>
            </div>
          ) : (
            activeCampaigns.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid #18181B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span className="price" style={{ fontSize: "12px", color: "#71717A" }}>
                  ID: {c.id.slice(0, 8)}…
                </span>
                <span style={{ fontSize: "11px", color: "#52525B" }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Honest integration status */}
      <div
        style={{
          marginTop: "40px",
          padding: "16px 20px",
          border: "1px solid #27272A",
          borderRadius: "8px",
          background: "#111113",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
          Integration Status
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
          {[
            { label: "Stellar DEX / Horizon",  status: "live",    note: "Testnet" },
            { label: "Supabase DB",            status: "live",    note: "Connected" },
            { label: "Soroban Contracts",      status: "pending", note: "Not deployed" },
            { label: "NEAR Intents",           status: "pending", note: "Phase 5" },
            { label: "Axelar Bridge",          status: "pending", note: "Phase 5" },
            { label: "Circle CCTP",            status: "pending", note: "Phase 5" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#F4F4F5" }}>{item.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: item.status === "live" ? "#22C55E" : "#52525B",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: "11px", color: "#52525B" }}>{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
