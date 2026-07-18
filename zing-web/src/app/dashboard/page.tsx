import React from "react";
import Link from "next/link";
import { PortfolioWidget } from "@/components/portfolio-widget";
import { ClickableRow } from "@/components/clickable-row";
import { supabase } from "@/lib/supabase";

// -----------------------------------------------------------------------------
// Data Fetching Helpers for LIVE Stellar Data
// -----------------------------------------------------------------------------
async function fetchStellarMarketData(baseAsset: string, baseIssuer: string) {
  try {
    const url = `https://horizon.stellar.org/trade_aggregations?base_asset_type=${baseAsset === 'XLM' ? 'native' : 'credit_alphanum4'}&base_asset_code=${baseAsset}&base_asset_issuer=${baseIssuer}&counter_asset_type=native&start_time=${Date.now() - 86400000}&end_time=${Date.now()}&resolution=86400000&limit=1`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    const record = data._embedded?.records[0];
    if (!record) return { price: 0, volume: 0, change: 0 };
    
    const change = ((parseFloat(record.close) - parseFloat(record.open)) / parseFloat(record.open)) * 100;
    
    return {
      price: parseFloat(record.close),
      volume: parseFloat(record.base_volume),
      change: change,
    };
  } catch (e) {
    return { price: 0, volume: 0, change: 0 };
  }
}

async function fetchFearAndGreed() {
  try {
    const res = await fetch("https://api.alternative.me/fng/", { next: { revalidate: 3600 } });
    const data = await res.json();
    return parseInt(data.data[0].value, 10);
  } catch (e) {
    return 50; 
  }
}

async function fetchProjects() {
  try {
    if (!supabase) return [];
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(4);
    return data || [];
  } catch(e) {
    return [];
  }
}

// -----------------------------------------------------------------------------
// UI Helpers (Icons, Charts)
// -----------------------------------------------------------------------------
const Icons = {
  USDC: () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
      <path d="M21.3396 16.5866C21.3396 15.3599 20.3796 14.7333 18.7396 14.3999C16.8996 14.0266 16.5129 13.6266 16.5129 12.9199C16.5129 12.2399 17.1529 11.7599 18.1796 11.7599C19.2463 11.7599 19.8863 12.2799 19.9929 13.0666H21.7396C21.6196 11.6666 20.7396 10.5333 19.1663 10.1599V8H17.2063V10.1333C15.6596 10.3199 14.5929 11.2399 14.5929 12.8399C14.5929 14.1599 15.6063 14.7333 17.3929 15.0933C19.3396 15.4799 19.5929 15.9333 19.5929 16.6666C19.5929 17.5199 18.7263 17.9733 17.8196 17.9733C16.6329 17.9733 15.8996 17.3333 15.7529 16.2933H14C14.1199 17.9199 15.2263 19.1066 17.1663 19.5466V21.7333H19.1263V19.5866C20.5796 19.4133 21.3396 18.3999 21.3396 16.5866Z" fill="white"/>
    </svg>
  ),
  XLM: () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#000"/>
      <path d="M21.9059 13.8447L17.7282 12.5932L17.7607 10.9686C17.7709 10.4578 17.3637 10.0354 16.8529 10.0253C16.4862 10.018 16.1554 10.229 16.0022 10.5654L14.7214 13.3768L9.20078 11.7226C8.68532 11.5681 8.1287 11.8471 7.95874 12.3458C7.79251 12.8335 8.04873 13.3632 8.52988 13.5517L12.9234 15.2713L12.2858 17.3197L7.66907 16.1668C7.15177 16.0377 6.63412 16.3571 6.51322 16.8797C6.39803 17.3777 6.69747 17.8732 7.18939 17.9961L12.0163 19.2017L11.3973 21.1896C11.2384 21.6999 11.5173 22.2476 12.0205 22.4132C12.4414 22.5517 12.8988 22.3683 13.1199 21.972L13.7847 20.7811L18.8252 21.9427C19.3408 22.0614 19.8517 21.7262 19.9654 21.1942C20.0754 20.6797 19.7423 20.1741 19.2198 20.0654L14.1685 19.0142L14.7937 17.0062L19.5306 17.925C20.0461 18.025 20.5369 17.6833 20.6276 17.1611C20.7153 16.656 20.3701 16.1683 19.8573 16.0688L15.1486 15.1554L15.7725 13.1514L21.4116 14.8407C21.9317 14.9966 22.4842 14.7042 22.6457 14.1873C22.8028 13.6845 22.5187 13.1417 22.0125 12.9897L21.9059 13.8447Z" fill="white"/>
    </svg>
  ),
  BTC: () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path d="M21.5796 15.3421C21.9333 13.9103 20.9168 13.1257 19.5072 12.6393L19.9864 10.7161L18.8159 10.4239L18.349 12.296C18.0416 12.2195 17.7268 12.1462 17.4121 12.0699L17.8821 10.1882L16.7116 9.89599L16.2348 11.808C15.9622 11.7431 15.6924 11.6781 15.4199 11.6094L15.421 11.6053L13.8242 11.2073L13.5163 12.443C13.5163 12.443 14.3752 12.639 14.352 12.6601C14.8213 12.7775 14.9082 13.0886 14.8887 13.332L14.4173 15.2238C14.4443 15.2307 14.4842 15.242 14.5323 15.2604L14.394 15.226L13.7291 17.8931C13.6307 18.0415 13.3768 18.2323 12.8986 18.1139C12.921 18.1365 12.0607 17.9221 12.0607 17.9221L11.4116 19.3499L12.9559 19.7351C13.2625 19.8118 13.5654 19.8927 13.864 19.9667L13.3831 21.897L14.5535 22.1892L15.0381 20.2458C15.3521 20.3283 15.6599 20.4048 15.9614 20.478L15.4746 22.4278L16.645 22.72L17.1352 20.7533C18.9959 21.1444 20.4578 21.0371 20.932 19.3475C21.3142 17.9868 20.7485 17.2023 19.756 16.7029C20.4877 16.5332 21.0569 16.0347 21.5796 15.3421ZM19.2605 18.7771C18.928 20.1086 16.8967 19.4673 15.9321 19.2272L16.5401 16.7869C17.5046 17.0282 19.6456 17.2344 19.2605 18.7771ZM19.6015 14.7335C19.3013 15.9392 17.6534 15.3853 16.8524 15.1852L17.3976 12.996C18.1985 13.1963 19.9493 13.3364 19.6015 14.7335Z" fill="white"/>
    </svg>
  )
};

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------
export default async function DashboardPage() {
  const fng = await fetchFearAndGreed();
  const projects = await fetchProjects();
  
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px", fontFamily: "var(--font-geist-sans)" }}>
      {/* 1. Top Highlight Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "24px" }}>
        
        {/* Primary Banner */}
        <div style={{ background: "linear-gradient(135deg, #18181B 0%, #09090B 100%)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "32px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "8px", letterSpacing: "-0.5px" }}>Zing Season 1 is Live</h2>
            <p style={{ color: "#A1A1AA", fontSize: "14px", maxWidth: "80%" }}>$1,000,000 Share Awaits!</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link href="/competitions" style={{ background: "#F59E0B", color: "#000", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>LAUNCH</Link>
          </div>
          <Link href="/competitions" style={{ position: "absolute", bottom: "24px", right: "24px", width: "32px", height: "32px", borderRadius: "50%", background: "#27272A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Secondary Banner */}
        <div style={{ background: "#111113", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "32px", position: "relative" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Stellar Network</h2>
            <p style={{ color: "#A1A1AA", fontSize: "14px", lineHeight: 1.5, maxWidth: "85%" }}>Explore Stellar and Get Your $50 Bonus Now!</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <Link href="/" style={{ background: "#3B82F6", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>EXPLORE</Link>
          </div>
          <Link href="/" style={{ position: "absolute", bottom: "24px", right: "24px", width: "32px", height: "32px", borderRadius: "50%", background: "#27272A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Small Banner - Axelar */}
        <div style={{ background: "linear-gradient(135deg, #18181B 0%, #09090B 100%)", borderRadius: "16px", border: "1px solid rgba(139, 92, 246, 0.15)", padding: "32px", position: "relative" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Cross-Chain via Axelar</h2>
            <p style={{ color: "#A1A1AA", fontSize: "14px", lineHeight: 1.5, maxWidth: "80%" }}>Route liquidity effortlessly from 20+ chains.</p>
          </div>
          <div style={{ position: "absolute", top: "24px", right: "24px" }}>
            <span style={{ background: "#8B5CF6", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>NEW</span>
          </div>
          <Link href="/trade" style={{ position: "absolute", bottom: "24px", right: "24px", width: "32px", height: "32px", borderRadius: "50%", background: "#27272A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      {/* 2. Middle Row: Trending, Portfolio, Markets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        
        {/* Top Trending */}
        <div style={{ background: "#111113", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#F59E0B" }}>🔥</span> Top Trending
            </h3>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", fontSize: "11px", color: "#71717A", fontWeight: 600, textTransform: "uppercase", marginBottom: "16px" }}>
            <div>Asset</div>
            <div style={{ textAlign: "right" }}>Price</div>
            <div style={{ textAlign: "right" }}>24h</div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { n: "USDC", p: "$1.000", c: 0.01, icon: Icons.USDC },
              { n: "BTC", p: "$92,430.5000", c: 1.25, icon: Icons.BTC },
              { n: "AQUA", p: "$0.003", c: 19.61, icon: Icons.XLM }
            ].map((t, i) => {
              const Icon = t.icon;
              return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#F4F4F5" }}>{t.n}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#F4F4F5", fontFamily: "var(--font-geist-mono)", textAlign: "right" }}>{t.p}</div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: t.c >= 0 ? "#10B981" : "#EF4444", textAlign: "right" }}>{t.c > 0 ? '+' : ''}{t.c}%</div>
              </div>
            )})}
          </div>
        </div>

        {/* User Portfolio */}
        <PortfolioWidget />

        {/* LaunchZone Overview */}
        <div style={{ background: "#111113", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#8B5CF6" }}>🚀</span> LaunchZone
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {projects.length > 0 ? projects.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: "#71717A", width: "12px" }}>{i + 1}</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}>
                  {p.symbol?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#F4F4F5" }}>{p.symbol}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", color: "#A1A1AA", fontFamily: "var(--font-geist-mono)" }}>Supply: {p.supply >= 1000000 ? (p.supply/1000000).toFixed(1) + 'M' : p.supply}</div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: "13px", color: "#A1A1AA", textAlign: "center", marginTop: "24px" }}>No tokens launched yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Data Table */}
      <div style={{ background: "#111113", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.05)", overflow: "hidden" }}>
        
        {/* Sub-nav tabs */}
        <div style={{ display: "flex", gap: "32px", padding: "0 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", background: "#09090B" }}>
          <Link href="/trade" style={{ textDecoration: "none", fontSize: "14px", fontWeight: 600, color: "#fff", borderBottom: "2px solid #3B82F6", padding: "20px 0", cursor: "pointer" }}>Spot</Link>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#71717A", padding: "20px 0", cursor: "not-allowed" }}>Perps & Futures <span style={{ background: "#27272A", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", marginLeft: "4px" }}>SOON</span></div>
          <Link href="/launch" style={{ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: "#71717A", padding: "20px 0", cursor: "pointer", transition: "color 0.2s" }} className="tab-hover">Launch Zone</Link>
          <Link href="/dashboard" style={{ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: "#71717A", padding: "20px 0", cursor: "pointer", transition: "color 0.2s" }} className="tab-hover">Social Booster</Link>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", color: "#A1A1AA", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "20px 24px", fontWeight: 500 }}>Asset</th>
              <th style={{ padding: "20px 24px", fontWeight: 500 }}>Price</th>
              <th style={{ padding: "20px 24px", fontWeight: 500 }}>24h Change</th>
              <th style={{ padding: "20px 24px", fontWeight: 500 }}>24h Volume</th>
              <th style={{ padding: "20px 24px", fontWeight: 500 }}>Swaps</th>
              <th style={{ padding: "20px 24px", fontWeight: 500 }}>Liquidity</th>
              <th style={{ padding: "20px 24px", fontWeight: 500 }}>Market Cap</th>
              <th style={{ padding: "20px 24px", fontWeight: 500 }}>Security</th>
            </tr>
          </thead>
          <tbody>
            {[
              { n: "USDC", p: "USDC/XLM", icon: Icons.USDC, pr: 1.000, ch: 0.01, v: "$2.83M", s: "74,415", l: "$12.4M", m: "$30.33B" },
              { n: "BTC", p: "BTC/XLM", icon: Icons.BTC, pr: 92430.50, ch: 1.25, v: "$1.20B", s: "45,120", l: "$450M", m: "$1.8T" },
              { n: "AQUA", p: "AQUA/XLM", icon: Icons.XLM, pr: 0.0031, ch: 19.61, v: "$1.20M", s: "45,120", l: "$12.01K", m: "$5.12M" }
            ].map((row, i) => {
              const Icon = row.icon;
              return (
              <ClickableRow key={i} href={`/trade?asset=${row.n}`} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.02)", transition: "background 0.2s" }} className="table-row-hover">
                <td style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
                    <Icon />
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{row.n}</div>
                      <div style={{ fontSize: "12px", color: "#71717A", fontWeight: 500 }}>{row.p}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "20px 24px", fontSize: "14px", color: "#fff", fontWeight: 500, fontFamily: "var(--font-geist-mono)" }}>${row.pr.toLocaleString(undefined, { minimumFractionDigits: 3 })}</td>
                <td style={{ padding: "20px 24px", fontSize: "14px", fontWeight: 600, color: row.ch >= 0 ? "#10B981" : "#EF4444" }}>{row.ch > 0 ? '+' : ''}{row.ch}%</td>
                <td style={{ padding: "20px 24px", fontSize: "14px", color: "#E4E4E7", fontWeight: 500 }}>{row.v}</td>
                <td style={{ padding: "20px 24px", fontSize: "14px", color: "#A1A1AA" }}>{row.s}</td>
                <td style={{ padding: "20px 24px", fontSize: "14px", color: "#E4E4E7", fontWeight: 500 }}>{row.l}</td>
                <td style={{ padding: "20px 24px", fontSize: "14px", color: "#A1A1AA" }}>{row.m}</td>
                <td style={{ padding: "20px 24px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.1)", color: "#10B981", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Audited
                  </div>
                </td>
              </ClickableRow>
            )})}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover { background-color: rgba(255, 255, 255, 0.03); cursor: pointer; }
        .tab-hover:hover { color: #fff !important; }
      `}} />
    </div>
  );
}
