"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./wallet-provider";

export default function WalletSidebar() {
  const { isSidebarOpen, closeSidebar, pubKey, connectWallet, getSupportedWallets, disconnectWallet } = useWallet();
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    if (isSidebarOpen && !pubKey) {
      getSupportedWallets().then(setWallets).catch(console.error);
    }
  }, [isSidebarOpen, pubKey, getSupportedWallets]);

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          zIndex: 100,
          backdropFilter: "blur(4px)",
        }}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "380px",
          background: "#09090B",
          borderLeft: "1px solid #27272A",
          zIndex: 101,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
          animation: "slideIn 0.2s ease-out forwards",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#F4F4F5", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>👛</span> Wallet
          </h2>
          <button
            onClick={closeSidebar}
            style={{ background: "transparent", border: "none", color: "#71717A", fontSize: "20px", cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {pubKey ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "#111113", padding: "20px", borderRadius: "12px", border: "1px solid #27272A" }}>
              <p style={{ fontSize: "12px", color: "#71717A", marginBottom: "8px" }}>Connected Account</p>
              <p style={{ fontSize: "14px", color: "#F4F4F5", fontFamily: "var(--font-geist-mono)", wordBreak: "break-all" }}>
                {pubKey}
              </p>
            </div>
            
            {/* Security & Limits */}
            <div style={{ background: "#111113", padding: "20px", borderRadius: "12px", border: "1px solid #27272A", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#F4F4F5", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#10B981" }}>🛡️</span> Security & Limits
              </h3>
              <p style={{ fontSize: "12px", color: "#A1A1AA" }}>Zing Smart Wallet Account Abstraction active.</p>
              
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#71717A", marginBottom: "8px" }}>Daily Spending Limit (USDC)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="number" placeholder="1000" style={{ flex: 1, padding: "8px", background: "#09090B", border: "1px solid #27272A", borderRadius: "6px", color: "#F4F4F5" }} />
                  <button style={{ background: "#27272A", color: "#F4F4F5", border: "none", borderRadius: "6px", padding: "0 12px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Save</button>
                </div>
              </div>
              
              <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#71717A", marginBottom: "8px" }}>Social Recovery Address</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" placeholder="G..." style={{ flex: 1, padding: "8px", background: "#09090B", border: "1px solid #27272A", borderRadius: "6px", color: "#F4F4F5" }} />
                  <button style={{ background: "#27272A", color: "#F4F4F5", border: "none", borderRadius: "6px", padding: "0 12px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Add</button>
                </div>
              </div>
            </div>

            <button
              onClick={disconnectWallet}
              style={{
                marginTop: "auto",
                padding: "12px",
                background: "transparent",
                border: "1px solid #3F3F46",
                color: "#F4F4F5",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#F4F4F5", marginBottom: "12px" }}>
              Welcome to Zing
            </h3>
            <p style={{ fontSize: "14px", color: "#71717A", marginBottom: "48px", maxWidth: "280px" }}>
              Select a Stellar wallet to securely sign transactions.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              {[
                { id: "freighter", name: "Freighter", icon: "🦊" },
                { id: "albedo", name: "Albedo", icon: "🌒" },
                { id: "xbull", name: "xBull", icon: "🐂" }
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => connectWallet(w.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    background: "#18181B",
                    border: "1px solid #27272A",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#27272A"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#18181B"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>{w.icon}</span>
                    <span style={{ color: "#F4F4F5", fontWeight: 600, fontSize: "16px" }}>{w.name}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "#3B82F6", background: "rgba(59, 130, 246, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>Connect</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    </>
  );
}
