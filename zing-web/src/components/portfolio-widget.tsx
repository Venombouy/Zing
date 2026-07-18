"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "./wallet-provider";
import { getBalances, TokenBalance } from "@/lib/stellar-trade";

export function PortfolioWidget() {
  const { pubKey } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pubKey) {
      setLoading(true);
      getBalances(pubKey)
        .then(setBalances)
        .finally(() => setLoading(false));
    } else {
      setBalances([]);
    }
  }, [pubKey]);

  if (!pubKey) {
    return (
      <div style={{ background: "#111113", borderRadius: "12px", border: "1px solid #27272A", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
        <p style={{ color: "#A1A1AA", fontSize: "14px", marginBottom: "12px" }}>Connect your wallet to view your real on-chain portfolio.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#111113", borderRadius: "12px", border: "1px solid #27272A", padding: "20px", display: "flex", flexDirection: "column" }}>
      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
        💼 My Portfolio
      </h3>
      
      {loading ? (
        <div style={{ color: "#A1A1AA", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>Fetching on-chain data...</div>
      ) : balances.length === 0 ? (
        <div style={{ color: "#A1A1AA", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>No assets found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
          {balances.map((b, i) => {
            const isNative = b.asset_type === "native";
            const code = isNative ? "XLM" : b.asset_code;
            const balanceNum = parseFloat(b.balance);
            
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#09090B", borderRadius: "8px", border: "1px solid #3F3F46" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isNative ? "#141629" : "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {code?.substring(0, 3)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#F4F4F5" }}>{code}</div>
                    {!isNative && (
                      <div 
                        title="Click to copy Issuer ID"
                        onClick={() => navigator.clipboard.writeText(b.asset_issuer!)}
                        style={{ fontSize: "11px", color: "#3B82F6", fontFamily: "var(--font-geist-mono)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        {b.asset_issuer?.substring(0, 6)}...{b.asset_issuer?.substring(50)}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", color: "#F4F4F5", fontFamily: "var(--font-geist-mono)", fontWeight: 500 }}>
                    {balanceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
