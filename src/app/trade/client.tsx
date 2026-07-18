"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchOrderBook,
  fetchRecentTrades,
  fetchTradeAggregations,
  fetchBalances,
  generateTestnetKeypair,
  fundWithFriendbot,
  buildSwapXDR,
  buildAddUSDCTrustlineXDR,
  submitXDR,
  getMidPrice,
  getSpread,
  fmt,
  XLM,
  USDC,
  type OrderBook,
  type TradeRecord,
  type TradeAgg,
  type Balance,
} from "@/lib/stellar";

// ─── Mini SVG Price Chart ─────────────────────────────────────────────────────

function PriceChart({ data }: { data: TradeAgg[] }) {
  if (!data.length) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#52525B",
          fontSize: "13px",
          borderBottom: "1px solid #27272A",
        }}
      >
        No chart data available on testnet for this pair — activity is sparse.
      </div>
    );
  }

  const closes = data.map((d) => parseFloat(d.close));
  const min    = Math.min(...closes) * 0.998;
  const max    = Math.max(...closes) * 1.002;
  const range  = max - min || 0.0001;
  const W = 800, H = 200;
  const padX = 8;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1 || 1)) * (W - padX * 2);
    const y = H - ((parseFloat(d.close) - min) / range) * H;
    return `${x},${y}`;
  });

  const isUp =
    closes.length >= 2 ? closes[closes.length - 1] >= closes[0] : true;
  const lineColor = isUp ? "#22C55E" : "#EF4444";

  return (
    <div style={{ borderBottom: "1px solid #27272A", background: "#09090B" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "160px", display: "block" }}
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "4px 12px 8px",
          fontSize: "10px",
          color: "#52525B",
        }}
      >
        <span>{new Date(parseInt(data[0].timestamp)).toLocaleTimeString()}</span>
        <span>24h price (USDC per XLM)</span>
        <span>
          {new Date(
            parseInt(data[data.length - 1].timestamp)
          ).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

// ─── Pair Header ──────────────────────────────────────────────────────────────

function PairHeader({
  ob,
  aggs,
  loading,
  lastUpdated,
}: {
  ob: OrderBook | null;
  aggs: TradeAgg[];
  loading: boolean;
  lastUpdated: Date | null;
}) {
  const mid = ob ? getMidPrice(ob) : null;
  const spread = ob ? getSpread(ob) : null;

  // 24h open from aggregations
  const open24h  = aggs.length > 0 ? parseFloat(aggs[0].open) : null;
  const close24h = aggs.length > 0 ? parseFloat(aggs[aggs.length - 1].close) : null;
  const change24h =
    open24h && close24h
      ? (((close24h - open24h) / open24h) * 100).toFixed(2)
      : null;
  const vol24h =
    aggs.length > 0
      ? aggs.reduce((s, a) => s + parseFloat(a.base_volume), 0)
      : null;

  return (
    <div
      style={{
        borderBottom: "1px solid #27272A",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "32px",
        flexWrap: "wrap",
        background: "#111113",
      }}
    >
      {/* Pair Name */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#F4F4F5" }}>
            XLM / USDC
          </span>
          <span className="tag tag-live">Stellar DEX</span>
          {/* Live dot */}
          <span
            className="blink"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#22C55E",
              display: "inline-block",
            }}
          />
        </div>
        <div style={{ fontSize: "11px", color: "#52525B", marginTop: "2px" }}>
          Horizon Testnet ·{" "}
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString()}`
            : "Connecting…"}
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="stat-label">Price (USDC)</div>
        <div
          className="price"
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: loading ? "#52525B" : "#F4F4F5",
          }}
        >
          {mid ?? (loading ? "—" : "No bids")}
        </div>
      </div>

      {/* 24h Change */}
      {change24h !== null && (
        <div>
          <div className="stat-label">24h Change</div>
          <div
            className="stat-value price"
            style={{
              color:
                parseFloat(change24h) >= 0 ? "#22C55E" : "#EF4444",
              fontWeight: 600,
            }}
          >
            {parseFloat(change24h) >= 0 ? "+" : ""}
            {change24h}%
          </div>
        </div>
      )}

      {/* 24h Volume */}
      {vol24h !== null && (
        <div>
          <div className="stat-label">24h Volume (XLM)</div>
          <div className="stat-value price">{fmt(vol24h, 0)}</div>
        </div>
      )}

      {/* Spread */}
      {spread && (
        <div>
          <div className="stat-label">Spread</div>
          <div className="stat-value price">{spread}%</div>
        </div>
      )}

      {/* Horizon link */}
      <div style={{ marginLeft: "auto" }}>
        <a
          href={`https://stellar.expert/explorer/testnet/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#52525B", textDecoration: "none" }}
        >
          Explorer ↗
        </a>
      </div>
    </div>
  );
}

// ─── Order Book ───────────────────────────────────────────────────────────────

function OrderBookPanel({ ob, loading }: { ob: OrderBook | null; loading: boolean }) {
  const maxBidAmt = ob?.bids.reduce((m, b) => Math.max(m, parseFloat(b.amount)), 0) ?? 1;
  const maxAskAmt = ob?.asks.reduce((m, a) => Math.max(m, parseFloat(a.amount)), 0) ?? 1;

  if (loading && !ob) {
    return (
      <div style={{ flex: 1, padding: "12px", color: "#52525B", fontSize: "12px" }}>
        Loading order book…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          padding: "6px 12px",
          borderBottom: "1px solid #27272A",
          fontSize: "10px",
          color: "#52525B",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <span>Price (USDC)</span>
        <span style={{ textAlign: "right" }}>Amount (XLM)</span>
        <span style={{ textAlign: "right" }}>Total</span>
      </div>

      {/* Asks (sells) — reversed so lowest ask is nearest mid */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {[...(ob?.asks ?? [])].reverse().map((a, i) => {
          const pct = (parseFloat(a.amount) / maxAskAmt) * 100;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                padding: "3px 12px",
                fontSize: "12px",
                position: "relative",
                cursor: "default",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: "rgba(239,68,68,0.06)",
                }}
              />
              <span className="price text-down" style={{ position: "relative" }}>{parseFloat(a.price).toFixed(7)}</span>
              <span className="price" style={{ textAlign: "right", color: "#F4F4F5", position: "relative" }}>
                {fmt(a.amount)}
              </span>
              <span className="price" style={{ textAlign: "right", color: "#71717A", position: "relative" }}>
                {fmt(parseFloat(a.price) * parseFloat(a.amount), 2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mid price separator */}
      {ob && getMidPrice(ob) && (
        <div
          style={{
            padding: "6px 12px",
            borderTop: "1px solid #27272A",
            borderBottom: "1px solid #27272A",
            background: "#18181B",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span className="price" style={{ fontSize: "14px", fontWeight: 600, color: "#F4F4F5" }}>
            {getMidPrice(ob)}
          </span>
          <span style={{ fontSize: "11px", color: "#52525B" }}>mid USDC</span>
        </div>
      )}

      {/* Bids (buys) */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {(ob?.bids ?? []).map((b, i) => {
          const pct = (parseFloat(b.amount) / maxBidAmt) * 100;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                padding: "3px 12px",
                fontSize: "12px",
                position: "relative",
                cursor: "default",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: "rgba(34,197,94,0.06)",
                }}
              />
              <span className="price text-up" style={{ position: "relative" }}>{parseFloat(b.price).toFixed(7)}</span>
              <span className="price" style={{ textAlign: "right", color: "#F4F4F5", position: "relative" }}>
                {fmt(b.amount)}
              </span>
              <span className="price" style={{ textAlign: "right", color: "#71717A", position: "relative" }}>
                {fmt(parseFloat(b.price) * parseFloat(b.amount), 2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trade History ────────────────────────────────────────────────────────────

function TradeHistoryPanel({ trades, loading }: { trades: TradeRecord[]; loading: boolean }) {
  if (loading && !trades.length) {
    return (
      <div style={{ padding: "16px", color: "#52525B", fontSize: "12px" }}>
        Loading recent trades…
      </div>
    );
  }

  if (!trades.length) {
    return (
      <div style={{ padding: "16px", color: "#52525B", fontSize: "12px" }}>
        No recent trades for XLM/USDC on testnet.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 100px 100px",
          padding: "6px 16px",
          fontSize: "10px",
          color: "#52525B",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          borderBottom: "1px solid #27272A",
        }}
      >
        <span>Time</span>
        <span style={{ textAlign: "right" }}>Side</span>
        <span style={{ textAlign: "right" }}>XLM</span>
        <span style={{ textAlign: "right" }}>Price (USDC)</span>
      </div>
      <div style={{ maxHeight: "240px", overflowY: "auto" }}>
        {trades.map((t) => {
          const isBuy   = !t.base_is_seller;
          const price   = (parseFloat(t.counter_amount) / parseFloat(t.base_amount)).toFixed(7);
          const timeStr = new Date(t.ledger_close_time).toLocaleTimeString();

          return (
            <div
              key={t.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 100px 100px",
                padding: "4px 16px",
                fontSize: "12px",
                borderBottom: "1px solid #18181B",
              }}
            >
              <span className="price" style={{ color: "#71717A" }}>{timeStr}</span>
              <span
                className="price"
                style={{ textAlign: "right", color: isBuy ? "#22C55E" : "#EF4444", fontWeight: 600 }}
              >
                {isBuy ? "BUY" : "SELL"}
              </span>
              <span className="price" style={{ textAlign: "right", color: "#F4F4F5" }}>
                {fmt(t.base_amount)}
              </span>
              <span className="price" style={{ textAlign: "right", color: isBuy ? "#22C55E" : "#EF4444" }}>
                {price}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Swap Module ──────────────────────────────────────────────────────────────

type WalletState =
  | { status: "disconnected" }
  | { status: "generating" }
  | { status: "funding" }
  | { status: "connected"; publicKey: string; secret: string; balances: Balance[] }
  | { status: "error"; message: string };

function SwapModule({ ob }: { ob: OrderBook | null }) {
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });
  const [sendAmt, setSendAmt] = useState("10");
  const [slippage, setSlippage] = useState("1"); // %
  const [swapStatus, setSwapStatus] = useState<"idle" | "building" | "submitting" | "done" | "error">("idle");
  const [swapMsg, setSwapMsg] = useState("");

  const midPrice = ob ? parseFloat(getMidPrice(ob) ?? "0") : 0;
  const recvEst  = midPrice > 0
    ? (parseFloat(sendAmt || "0") * midPrice * (1 - parseFloat(slippage || "0") / 100)).toFixed(6)
    : "—";

  async function connectWallet() {
    setWallet({ status: "generating" });
    const kp = generateTestnetKeypair();
    setWallet({ status: "funding" });
    const ok = await fundWithFriendbot(kp.publicKey);
    if (!ok) {
      setWallet({ status: "error", message: "Friendbot funding failed. Network may be down." });
      return;
    }
    // Short wait for ledger close
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const { fetchBalances } = await import("@/lib/stellar");
      const balances = await fetchBalances(kp.publicKey);
      setWallet({ status: "connected", ...kp, balances });
    } catch (e) {
      setWallet({ status: "error", message: `Account loaded but balance fetch failed: ${(e as Error).message}` });
    }
  }

  async function doSwap() {
    if (wallet.status !== "connected") return;
    if (!sendAmt || parseFloat(sendAmt) <= 0) return;

    setSwapStatus("building");
    setSwapMsg("");

    try {
      // destMin = estimated receive * (1 - slippage)
      const destMin = Math.max(0.0000001, parseFloat(recvEst) * (1 - parseFloat(slippage) / 100))
        .toFixed(7);

      const xdr = await buildSwapXDR({
        signerSecret: wallet.secret,
        sendAsset:    XLM,
        sendAmount:   parseFloat(sendAmt).toFixed(7),
        destAsset:    USDC,
        destMin,
      });

      setSwapStatus("submitting");
      const res = await submitXDR(xdr);

      if (res.successful) {
        setSwapStatus("done");
        setSwapMsg(`Swap confirmed · tx ${res.hash.slice(0, 12)}…`);
        // Refresh balances
        const newBal = await fetchBalances(wallet.publicKey);
        setWallet((w) =>
          w.status === "connected" ? { ...w, balances: newBal } : w
        );
      } else {
        setSwapStatus("error");
        setSwapMsg("Transaction submitted but failed on-chain.");
      }
    } catch (e: unknown) {
      setSwapStatus("error");
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      // Surface real Horizon error codes
      const horizonDetail =
        (e as { response?: { data?: { extras?: { result_codes?: unknown } } } })?.response?.data?.extras?.result_codes;
      setSwapMsg(horizonDetail ? JSON.stringify(horizonDetail) : errMsg);
    }
  }

  async function addUSDCTrustline() {
    if (wallet.status !== "connected") return;
    setSwapStatus("building");
    setSwapMsg("");
    try {
      const xdr = await buildAddUSDCTrustlineXDR(wallet.secret);
      setSwapStatus("submitting");
      const res = await submitXDR(xdr);
      if (res.successful) {
        setSwapStatus("done");
        setSwapMsg("USDC trustline added.");
        const newBal = await fetchBalances(wallet.publicKey);
        setWallet((w) =>
          w.status === "connected" ? { ...w, balances: newBal } : w
        );
      } else {
        setSwapStatus("error");
        setSwapMsg("Trustline tx failed on-chain.");
      }
    } catch (e: unknown) {
      setSwapStatus("error");
      setSwapMsg((e as Error).message);
    }
  }

  const usdcBalance = wallet.status === "connected"
    ? wallet.balances.find((b) => b.assetCode === "USDC")
    : null;
  const xlmBalance  = wallet.status === "connected"
    ? wallet.balances.find((b) => b.assetType === "native")
    : null;
  const hasUSDCTrustline = !!usdcBalance;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Panel title */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid #27272A",
          fontSize: "12px",
          fontWeight: 600,
          color: "#F4F4F5",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Swap
      </div>

      <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>
        {/* Wallet Section */}
        {wallet.status === "disconnected" && (
          <div>
            <p style={{ fontSize: "12px", color: "#71717A", marginBottom: "12px", lineHeight: 1.5 }}>
              Generate a testnet wallet funded by Friendbot (10,000 XLM) to test swaps. Private key stays in browser memory only.
            </p>
            <button
              onClick={connectWallet}
              style={{
                width: "100%",
                padding: "10px",
                background: "#F59E0B",
                color: "#09090B",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Generate Testnet Wallet
            </button>
          </div>
        )}

        {(wallet.status === "generating" || wallet.status === "funding") && (
          <div style={{ color: "#71717A", fontSize: "13px" }}>
            {wallet.status === "generating" ? "Generating keypair…" : "Funding via Friendbot (takes ~5s)…"}
          </div>
        )}

        {wallet.status === "error" && (
          <div>
            <div style={{ color: "#EF4444", fontSize: "12px", marginBottom: "12px" }}>
              {wallet.message}
            </div>
            <button
              onClick={() => setWallet({ status: "disconnected" })}
              style={{ fontSize: "12px", color: "#71717A", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ← Try again
            </button>
          </div>
        )}

        {wallet.status === "connected" && (
          <div>
            {/* Account info */}
            <div
              style={{
                padding: "10px",
                background: "#18181B",
                borderRadius: "6px",
                marginBottom: "16px",
                border: "1px solid #27272A",
              }}
            >
              <div style={{ fontSize: "10px", color: "#52525B", marginBottom: "4px", textTransform: "uppercase" }}>
                Testnet Account
              </div>
              <div
                className="price"
                style={{ fontSize: "11px", color: "#71717A", wordBreak: "break-all" }}
              >
                {wallet.publicKey}
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "16px" }}>
                <span style={{ fontSize: "12px", color: "#F4F4F5" }}>
                  <span style={{ color: "#71717A" }}>XLM: </span>
                  <span className="price">{xlmBalance?.balance ?? "—"}</span>
                </span>
                <span style={{ fontSize: "12px", color: "#F4F4F5" }}>
                  <span style={{ color: "#71717A" }}>USDC: </span>
                  <span className="price">{usdcBalance?.balance ?? (hasUSDCTrustline ? "0" : "No trustline")}</span>
                </span>
              </div>
            </div>

            {/* Add USDC trustline if needed */}
            {!hasUSDCTrustline && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: "#71717A", marginBottom: "8px" }}>
                  You need a USDC trustline before receiving USDC from swaps.
                </p>
                <button
                  onClick={addUSDCTrustline}
                  disabled={swapStatus === "building" || swapStatus === "submitting"}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "#18181B",
                    color: "#F59E0B",
                    border: "1px solid #F59E0B",
                    borderRadius: "6px",
                    fontWeight: 500,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Add USDC Trustline
                </button>
              </div>
            )}

            {/* Swap form */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", color: "#71717A", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>
                Sell (XLM)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="number"
                  min="0.0000001"
                  step="1"
                  value={sendAmt}
                  onChange={(e) => setSendAmt(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    background: "#18181B",
                    border: "1px solid #27272A",
                    borderRadius: "6px",
                    color: "#F4F4F5",
                    fontSize: "14px",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                />
                <button
                  onClick={() => setSendAmt(xlmBalance ? (parseFloat(xlmBalance.balance) - 2).toFixed(2) : "0")}
                  style={{
                    padding: "8px 10px",
                    background: "#27272A",
                    border: "none",
                    borderRadius: "6px",
                    color: "#F59E0B",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  MAX
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", color: "#71717A", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>
                Receive (USDC) — estimated
              </label>
              <div
                className="price"
                style={{
                  padding: "8px 10px",
                  background: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#F4F4F5",
                }}
              >
                {recvEst}
              </div>
            </div>

            {/* Slippage */}
            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#71717A" }}>Slippage:</span>
              {["0.5", "1", "2"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  style={{
                    padding: "3px 8px",
                    background: slippage === s ? "#27272A" : "transparent",
                    border: `1px solid ${slippage === s ? "#3F3F46" : "#27272A"}`,
                    borderRadius: "4px",
                    color: slippage === s ? "#F4F4F5" : "#71717A",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  {s}%
                </button>
              ))}
            </div>

            {/* Price info */}
            {midPrice > 0 && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#52525B",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Rate</span>
                <span className="price">1 XLM = {midPrice.toFixed(7)} USDC</span>
              </div>
            )}

            {/* Swap Button */}
            <button
              onClick={doSwap}
              disabled={
                swapStatus === "building" ||
                swapStatus === "submitting" ||
                !hasUSDCTrustline ||
                !parseFloat(sendAmt)
              }
              style={{
                width: "100%",
                padding: "11px",
                background:
                  swapStatus === "building" || swapStatus === "submitting"
                    ? "#3F3F46"
                    : !hasUSDCTrustline
                    ? "#1C1917"
                    : "#F59E0B",
                color:
                  !hasUSDCTrustline || swapStatus === "building" || swapStatus === "submitting"
                    ? "#71717A"
                    : "#09090B",
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "14px",
                cursor:
                  swapStatus === "building" || swapStatus === "submitting" || !hasUSDCTrustline
                    ? "not-allowed"
                    : "pointer",
                transition: "all 150ms ease",
              }}
            >
              {swapStatus === "building"
                ? "Building transaction…"
                : swapStatus === "submitting"
                ? "Submitting to Stellar…"
                : !hasUSDCTrustline
                ? "Add trustline first"
                : "Swap XLM → USDC"}
            </button>

            {/* Swap result */}
            {swapMsg && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "8px 10px",
                  background: swapStatus === "done" ? "#14532D" : "#7F1D1D",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: swapStatus === "done" ? "#4ADE80" : "#FCA5A5",
                  wordBreak: "break-all",
                }}
              >
                {swapMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Trading Terminal ────────────────────────────────────────────────────

export default function TradingTerminal() {
  const [ob, setOb]         = useState<OrderBook | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [aggs, setAggs]     = useState<TradeAgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tab, setTab]       = useState<"chart" | "info">("chart");
  const pollRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [newOb, newTrades] = await Promise.all([
        fetchOrderBook(15),
        fetchRecentTrades(30),
      ]);
      setOb(newOb);
      setTrades(newTrades);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(`Horizon error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    refresh();
    // Fetch aggregations once (slow call)
    fetchTradeAggregations(3600000, 24).then(setAggs);
    // Poll order book + trades every 5 seconds
    pollRef.current = setInterval(refresh, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 52px)" }}>
      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: "8px 20px",
            background: "#7F1D1D",
            color: "#FCA5A5",
            fontSize: "12px",
            borderBottom: "1px solid #991B1B",
          }}
        >
          {error} — retrying automatically every 5 seconds.
        </div>
      )}

      {/* Pair Header */}
      <PairHeader ob={ob} aggs={aggs} loading={loading} lastUpdated={lastUpdated} />

      {/* Main 3-column layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Left: Order Book ── */}
        <div
          style={{
            width: "280px",
            flexShrink: 0,
            borderRight: "1px solid #27272A",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #27272A",
              fontSize: "11px",
              fontWeight: 600,
              color: "#F4F4F5",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Order Book · XLM/USDC
          </div>
          <OrderBookPanel ob={ob} loading={loading} />
        </div>

        {/* ── Center: Chart + Trade History ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #27272A",
              background: "#111113",
            }}
          >
            {(["chart", "info"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "9px 20px",
                  fontSize: "12px",
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? "#F4F4F5" : "#71717A",
                  background: "transparent",
                  border: "none",
                  borderBottom: tab === t ? "2px solid #F59E0B" : "2px solid transparent",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "chart" && (
            <div style={{ flex: 1, overflow: "auto" }}>
              <PriceChart data={aggs} />

              {/* Stats row */}
              {aggs.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    borderBottom: "1px solid #27272A",
                    padding: "0",
                  }}
                >
                  {[
                    { label: "24h Open",  value: fmt(aggs[0].open, 7) },
                    { label: "24h High",  value: fmt(Math.max(...aggs.map((a) => parseFloat(a.high))), 7) },
                    { label: "24h Low",   value: fmt(Math.min(...aggs.map((a) => parseFloat(a.low))), 7) },
                    { label: "24h Close", value: fmt(aggs[aggs.length - 1].close, 7) },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        padding: "10px 16px",
                        borderRight: "1px solid #27272A",
                      }}
                    >
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value price">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trade history */}
              <div>
                <div
                  style={{
                    padding: "8px 16px",
                    borderBottom: "1px solid #27272A",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#F4F4F5",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Recent Trades
                  {!loading && trades.length > 0 && (
                    <span
                      className="blink"
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#22C55E",
                        display: "inline-block",
                      }}
                    />
                  )}
                </div>
                <TradeHistoryPanel trades={trades} loading={loading} />
              </div>
            </div>
          )}

          {tab === "info" && (
            <div style={{ padding: "24px", overflowY: "auto" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", color: "#F4F4F5" }}>
                XLM / USDC — Stellar Testnet
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <tbody>
                  {[
                    ["Base Asset",    "XLM (Lumens) — Stellar native asset"],
                    ["Quote Asset",   "USDC (USD Coin)"],
                    ["USDC Issuer",   "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"],
                    ["Network",       "Stellar Testnet"],
                    ["Horizon URL",   "https://horizon-testnet.stellar.org"],
                    ["Trading",       "Stellar Decentralized Exchange (SDEX)"],
                    ["Settlement",    "Ledger-native — atomic, same-tx settlement"],
                    ["Cross-chain",   "NEAR Intents + Axelar + CCTP (Phase 2 — integration pending)"],
                    ["Contracts",     "Soroban (Phase 3 — not yet deployed)"],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: "1px solid #27272A" }}>
                      <td style={{ padding: "8px 0", color: "#71717A", width: "140px" }}>{k}</td>
                      <td className="price" style={{ padding: "8px 0", color: "#F4F4F5", wordBreak: "break-all" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right: Swap ── */}
        <div
          style={{
            width: "300px",
            flexShrink: 0,
            borderLeft: "1px solid #27272A",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <SwapModule ob={ob} />
        </div>
      </div>
    </div>
  );
}
