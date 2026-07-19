import React from "react";
import Link from "next/link";
import { PortfolioWidget } from "@/components/portfolio-widget";
import { QuestsWidget } from "@/components/quests-widget";
import { SentimentPoll } from "@/components/sentiment-poll";
import { supabase } from "@/lib/supabase";
import { WebGLLiquid } from "@/components/ui/webgl-liquid";

// -----------------------------------------------------------------------------
// Data Fetching Helpers for LIVE Data
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
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5);
    return data || [];
  } catch(e) {
    return [];
  }
}

async function fetchCoinloreGlobal() {
  try {
    const res = await fetch("https://api.coinlore.net/api/global/", { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0];
  } catch (e) { return null; }
}

async function fetchCoinGeckoCategories() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/categories?order=market_cap_desc", { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) { return []; }
}

async function fetchCoinGeckoTrending() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/search/trending", { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.coins || [];
  } catch (e) { return []; }
}

// -----------------------------------------------------------------------------
// UI Helpers (Icons, Formats)
// -----------------------------------------------------------------------------
const formatMcap = (num: number) => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toLocaleString();
};

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

const CircleGauge = ({ percentage, color, label }: { percentage: number, color: string, label: string }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: "100px", height: "100px" }}>
        <svg style={{ transform: "rotate(-90deg)" }} width="100" height="100">
          <circle cx="50" cy="50" r={radius} stroke="#27272A" strokeWidth="8" fill="none" />
          <circle cx="50" cy="50" r={radius} stroke={color} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-geist-mono)" }}>
          {percentage}%
        </div>
      </div>
      <div style={{ color: "#71717A", fontSize: "11px", marginTop: "8px" }}>{label}</div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------
export default async function DashboardPage() {
  const fng = await fetchFearAndGreed();
  const projects = await fetchProjects();
  
  const btcData = await fetchStellarMarketData("BTC", "GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH");
  const usdcData = await fetchStellarMarketData("USDC", "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");
  const aquaData = await fetchStellarMarketData("AQUA", "GBNZILSTVQZ4R7IKQZGVKOU3TAWQQ23NDC3MVDQHMZKE4VBNRE9IJEAE");

  const cgGlobal = await fetchCoinloreGlobal();
  const cgCategories = await fetchCoinGeckoCategories();
  const cgTrending = await fetchCoinGeckoTrending();

  // Extract Global metrics
  const btcDom = cgGlobal ? Math.round(parseFloat(cgGlobal.btc_d)) : 59;
  const totalMcap = cgGlobal ? parseFloat(cgGlobal.total_mcap) : 2190000000000;
  const globalMcapChange = cgGlobal ? parseFloat(cgGlobal.mcap_change) : 1.4;

  const assets = cgTrending.slice(0, 5).map((coin: any) => {
    const c = coin.item;
    const rawPrice = c.data?.price || 0;
    // Some CoinGecko endpoints return price as a number, some as a string like "$1.00"
    let priceNum = 0;
    if (typeof rawPrice === "number") {
      priceNum = rawPrice;
    } else if (typeof rawPrice === "string") {
      priceNum = parseFloat(rawPrice.replace(/[^0-9.-]+/g,"")) || 0;
    }
    return {
      n: c.symbol.toUpperCase(),
      p: c.name,
      thumb: c.thumb,
      pr: priceNum,
      ch: c.data?.price_change_percentage_24h?.usd || 0,
      v: c.data?.total_volume || "$0",
      l: c.data?.market_cap || "$0", 
      m: c.data?.market_cap || "$0"
    };
  });

  return (
    <div style={{ padding: "24px", fontFamily: "var(--font-geist-sans)", minHeight: "100%", display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>
      
      {/* 1. Promotional Banner Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {/* Banner 1 */}
        <div className="banner-card" style={{ background: "linear-gradient(135deg, #0A1128, #0B1930)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", padding: "16px", position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Zing</div>
          <div style={{ fontSize: "13px", color: "#A1A1AA" }}>Season 2 is Live</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginTop: "16px", background: "rgba(59,130,246,0.1)", display: "inline-block", padding: "6px 12px", borderRadius: "16px" }}>
            $1,000,000 Share Awaits!
          </div>
          <div style={{ position: "absolute", right: "-10px", top: "-10px", width: "80px", height: "80px", background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)" }}></div>
        </div>
        
        {/* Banner 2 */}
        <div className="banner-card" style={{ background: "linear-gradient(135deg, #111827, #030712)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px", position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Zing</div>
          <div style={{ fontSize: "13px", color: "#A1A1AA", marginBottom: "16px" }}>Explore Zing and Get</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#F59E0B" }}>Your $50 💸 Bonus Now!</div>
        </div>

        {/* Banner 3 */}
        <div className="banner-card" style={{ background: "linear-gradient(135deg, #1E1B4B, #0F172A)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Stellar</div>
            <div style={{ fontSize: "13px", color: "#A1A1AA", lineHeight: "1.4" }}>Stellar LaunchZone<br/>is Live Now</div>
          </div>
          <div style={{ background: "#000", padding: "8px", borderRadius: "50%", border: "2px solid #fff" }}><Icons.XLM /></div>
        </div>

        {/* Banner 4 */}
        <div className="banner-card" style={{ background: "linear-gradient(135deg, #451A03, #27272A)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
             <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Core</div>
            <div style={{ fontSize: "13px", color: "#A1A1AA", lineHeight: "1.4" }}>Explore Core<br/>Blockchain</div>
          </div>
          <div style={{ fontSize: "28px" }}>🔶</div>
        </div>
      </div>

      {/* Main Grid: 3 Columns matching AIDA exactly */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
        
        {/* Column 1 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Trending */}
          <div style={{ background: "rgba(17, 17, 19, 0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>Top Trending</div>
            </div>
            <div style={{ padding: "12px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "0 16px", marginBottom: "12px", fontSize: "11px", color: "#71717A", textTransform: "uppercase", fontWeight: 600 }}>
                <div>Name</div>
                <div style={{ textAlign: "right" }}>Price</div>
                <div style={{ textAlign: "right" }}>24h Change</div>
              </div>
              {cgTrending.slice(0, 5).map((coin: any, i: number) => {
                const c = coin.item;
                const change = c.data.price_change_percentage_24h?.usd || 0;
                return (
                  <Link href={`/trade?asset=${c.symbol}`} key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", alignItems: "center", padding: "10px 16px", transition: "background 0.2s", textDecoration: "none" }} className="row-hover">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img src={c.thumb} alt={c.symbol} style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#F4F4F5" }}>{c.symbol}</div>
                        <div style={{ fontSize: "10px", color: "#71717A" }}>{c.name.substring(0,10)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", color: "#F4F4F5", fontFamily: "var(--font-geist-mono)", textAlign: "right" }}>
                      {c.data.price}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: change >= 0 ? "#10B981" : "#EF4444", textAlign: "right", fontFamily: "var(--font-geist-mono)" }}>
                      {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <QuestsWidget />

          {/* Total M.Cap */}
          <div style={{ background: "rgba(17, 17, 19, 0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Total M.Cap</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-geist-mono)" }}>
                ${formatMcap(totalMcap)}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: globalMcapChange >= 0 ? "#10B981" : "#EF4444" }}>
                {globalMcapChange > 0 ? '▲' : '▼'} {Math.abs(globalMcapChange).toFixed(1)}%
              </div>
            </div>
            {/* Sparkline Mock representing chart */}
            <svg viewBox="0 0 300 60" width="100%" height="60" style={{ opacity: 0.8 }}>
              <path d="M0,40 Q20,50 40,30 T80,20 T120,35 T160,10 T200,25 T240,5 T300,15" fill="none" stroke="#10B981" strokeWidth="2" />
              <path d="M0,40 Q20,50 40,30 T80,20 T120,35 T160,10 T200,25 T240,5 T300,15 L300,60 L0,60 Z" fill="url(#gradientGreen)" opacity="0.2" />
              <defs>
                <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Top Narrative */}
          <div style={{ background: "rgba(17, 17, 19, 0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px", flex: 1 }}>
             <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
               <span>Top Narrative</span>
               <span style={{ fontSize: "11px", color: "#71717A", fontWeight: 500, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px" }}>View All</span>
             </div>
             <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", marginBottom: "12px", fontSize: "11px", color: "#71717A", textTransform: "uppercase", fontWeight: 600 }}>
                <div>Name</div>
                <div style={{ textAlign: "right" }}>M.Cap</div>
                <div style={{ textAlign: "right" }}>24h Change</div>
             </div>
             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
               {cgCategories.slice(0, 4).map((cat: any, i: number) => (
                 <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", alignItems: "center" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                     <span style={{ fontSize: "12px", color: "#71717A" }}>{i + 1}</span>
                     <span style={{ fontSize: "13px", fontWeight: 500, color: "#F4F4F5" }}>{cat.name.replace(' Ecosystem', '')}</span>
                   </div>
                   <div style={{ fontSize: "12px", color: "#A1A1AA", textAlign: "right", fontFamily: "var(--font-geist-mono)" }}>
                     {formatMcap(cat.market_cap)}
                   </div>
                   <div style={{ fontSize: "12px", fontWeight: 600, color: cat.market_cap_change_24h >= 0 ? "#10B981" : "#EF4444", textAlign: "right" }}>
                     {cat.market_cap_change_24h > 0 ? '+' : ''}{cat.market_cap_change_24h?.toFixed(2)}%
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Column 3 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Market Trends (BTC Dom & Fear Greed) */}
          <div style={{ background: "rgba(17, 17, 19, 0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "20px" }}>
             <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>Market Trends</div>
             <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "24px" }}>
               <CircleGauge percentage={btcDom} color="#10B981" label="BTC vs Crypto Market" />
               <CircleGauge percentage={fng} color={fng > 50 ? "#10B981" : (fng < 40 ? "#EF4444" : "#F59E0B")} label="Investors Sentiment" />
             </div>
             
             {/* Community Sentiment */}
             <SentimentPoll />
          </div>

          {/* LaunchZone Overview */}
          <div style={{ background: "rgba(17, 17, 19, 0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "14px", fontWeight: 600, color: "#fff", display: "flex", justifyContent: "space-between" }}>
              <span>LaunchZone</span>
              <Link href="/launch/create" style={{ fontSize: "11px", color: "#71717A", fontWeight: 500, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px", textDecoration: "none" }}>Launch Now</Link>
            </div>
            <div style={{ padding: "12px 0" }}>
               <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "0 16px", marginBottom: "12px", fontSize: "11px", color: "#71717A", textTransform: "uppercase", fontWeight: 600 }}>
                <div>Name</div>
                <div style={{ textAlign: "right" }}>Target</div>
                <div style={{ textAlign: "right" }}>Status</div>
              </div>
              {projects.length > 0 ? projects.map((p, i) => (
                <Link href={`/launch/${p.id}`} key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", alignItems: "center", padding: "8px 16px", textDecoration: "none" }} className="row-hover">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#71717A", width: "12px" }}>{i + 1}</div>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}>
                      {p.symbol?.[0]}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#F4F4F5" }}>{p.symbol}</div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#A1A1AA", fontFamily: "var(--font-geist-mono)", textAlign: "right" }}>{p.target_amount} XLM</div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "9px", color: "#10B981", fontWeight: 700 }}>LIVE</span>
                  </div>
                </Link>
              )) : (
                <div style={{ fontSize: "12px", color: "#A1A1AA", textAlign: "center", padding: "16px" }}>No active launches</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spot Market Table at bottom */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <PortfolioWidget />

          {/* Data Table */}
          <div style={{ background: "rgba(17, 17, 19, 0.5)", backdropFilter: "blur(12px)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
            
            <div style={{ display: "flex", gap: "24px", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(9, 9, 11, 0.5)", backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", borderBottom: "2px solid #3B82F6", padding: "16px 0", cursor: "pointer" }}>Spot</div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#71717A", padding: "16px 0", cursor: "not-allowed" }}>Perps & Futures</div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#71717A", padding: "16px 0", cursor: "pointer" }} className="tab-hover">Prediction Markets</div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#71717A", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "11px" }}>
                  <th style={{ padding: "16px", fontWeight: 600 }}>Asset</th>
                  <th style={{ padding: "16px", fontWeight: 600, textAlign: "right" }}>Price</th>
                  <th style={{ padding: "16px", fontWeight: 600, textAlign: "right" }}>24h Change</th>
                  <th style={{ padding: "16px", fontWeight: 600, textAlign: "center" }}>24h Chart</th>
                  <th style={{ padding: "16px", fontWeight: 600, textAlign: "right" }}>Volume</th>
                  <th style={{ padding: "16px", fontWeight: 600, textAlign: "right" }}>Liquidity</th>
                  <th style={{ padding: "16px", fontWeight: 600, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((row: any, i: number) => {
                  const Icon = row.icon;
                  return (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.2s" }} className="row-hover">
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#27272A" }}>
                           {row.thumb ? <img src={row.thumb} alt={row.n} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff" }}>{row.n}</div>
                          <div style={{ fontSize: "11px", color: "#71717A" }}>{row.p}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px", color: "#fff", fontWeight: 500, fontFamily: "var(--font-geist-mono)", textAlign: "right" }}>
                      ${row.pr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td style={{ padding: "16px", fontWeight: 600, color: row.ch >= 0 ? "#10B981" : "#EF4444", fontFamily: "var(--font-geist-mono)", textAlign: "right" }}>
                      {row.ch > 0 ? '+' : ''}{row.ch.toFixed(2)}%
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                       <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
                         <path d={row.ch >= 0 ? "M0,20 Q10,24 20,16 T40,12 T60,8 T80,4" : "M0,4 Q10,8 20,12 T40,16 T60,20 T80,24"} stroke={row.ch >= 0 ? "#10B981" : "#EF4444"} strokeWidth="1.5" />
                       </svg>
                    </td>
                    <td style={{ padding: "16px", color: "#E4E4E7", fontWeight: 500, fontFamily: "var(--font-geist-mono)", textAlign: "right", fontSize: "11px" }}>{row.v}</td>
                    <td style={{ padding: "16px", color: "#E4E4E7", fontWeight: 500, fontFamily: "var(--font-geist-mono)", textAlign: "right", fontSize: "11px" }}>{row.l}</td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                       <Link href={`/trade?asset=${row.n}`} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, textDecoration: "none" }} className="flash-buy-btn">
                         TRADE
                       </Link>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .row-hover:hover { background-color: rgba(255,255,255,0.03) !important; cursor: pointer; }
        .tab-hover:hover { color: #fff !important; }
        .flash-buy-btn:hover { background: #3B82F6 !important; color: #fff !important; }
        .sentiment-btn:hover { background: rgba(255,255,255,0.05) !important; }
        .banner-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .banner-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 10px 30px -10px rgba(59,130,246,0.3); border-color: rgba(255,255,255,0.2) !important; }
      `}} />
    </div>
  );
}
