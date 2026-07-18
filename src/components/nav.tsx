"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "./wallet-provider";

export default function Nav() {
  const pathname = usePathname();
  const { openSidebar, pubKey } = useWallet();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname.startsWith(path);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

  if (pathname === "/") return null;

  return (
    <div style={{ position: "sticky", top: "16px", zIndex: 50, display: "flex", justifyContent: "center", width: "100%", paddingBottom: "16px", marginTop: "16px" }}>
      <nav style={{ 
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "calc(100% - 48px)", maxWidth: "1100px",
        background: "rgba(10, 10, 10, 0.6)",
        backdropFilter: "blur(12px)",
        border: "1px solid #2C2C2C",
        borderRadius: "70px",
        padding: "12px 20px",
        position: "relative"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", textDecoration: "none" }}>
            ZING
          </Link>

          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/dashboard" style={{ fontSize: "14px", fontWeight: 500, color: isActive("/dashboard") ? "#fff" : "#A1A1AA", textDecoration: "none", transition: "color 0.2s" }}>Trade</Link>
            <Link href="/launch" style={{ fontSize: "14px", fontWeight: 500, color: isActive("/launch") ? "#fff" : "#A1A1AA", textDecoration: "none", transition: "color 0.2s" }}>LaunchZone</Link>
            <Link href="/social-booster" style={{ fontSize: "14px", fontWeight: 500, color: isActive("/social-booster") ? "#fff" : "#A1A1AA", textDecoration: "none", transition: "color 0.2s" }}>Social Booster</Link>
            <Link href="/competitions" style={{ fontSize: "14px", fontWeight: 500, color: isActive("/competitions") ? "#fff" : "#A1A1AA", textDecoration: "none", transition: "color 0.2s" }}>Competitions</Link>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Search Bar */}
          <div style={{ position: "relative" }}>
            <input 
              type="text" 
              placeholder="Search tokens by name or contract" 
              style={{ 
                background: "#18181B", border: "1px solid #27272A", borderRadius: "900px",
                padding: "8px 12px 8px 36px", fontSize: "13px", color: "#F4F4F5", width: "240px", outline: "none"
              }} 
            />
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#71717A" }}>🔍</span>
          </div>

          {/* Network Selector Mock */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#18181B", padding: "6px 12px", borderRadius: "900px", border: "1px solid #27272A" }}>
            <span style={{ fontSize: "14px" }}>🚀</span>
          </div>

          {/* Wallet Button */}
          <button 
            onClick={openSidebar}
            style={{ 
              background: "#fff", border: "none", borderRadius: "900px",
              padding: "8px 16px", fontSize: "13px", fontWeight: 700, color: "#000",
              display: "flex", alignItems: "center", gap: "6px", cursor: "pointer",
              transition: "transform 0.2s"
            }}
          >
            <span style={{ fontSize: "14px" }}>👛</span>
            {pubKey ? `${pubKey.substring(0, 4)}...${pubKey.substring(pubKey.length - 4)}` : "Wallet"}
          </button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              style={{ background: "transparent", border: "none", color: isNotifOpen ? "#fff" : "#A1A1AA", cursor: "pointer", fontSize: "16px", padding: "6px 4px", transition: "color 0.2s" }} 
            >
              🔔
            </button>

            {/* Dropdown Panel */}
            {isNotifOpen && (
              <div style={{ 
                position: "absolute", top: "calc(100% + 16px)", right: "-40px", width: "320px",
                background: "#111113", border: "1px solid #27272A", borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 
              }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #27272A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>Notifications</span>
                  <button onClick={() => setIsNotifOpen(false)} style={{ background: "transparent", border: "none", color: "#A1A1AA", fontSize: "12px", cursor: "pointer" }}>Mark all as read</button>
                </div>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid #27272A", display: "flex", gap: "12px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3B82F6", marginTop: "6px" }} />
                    <div>
                      <div style={{ color: "#fff", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Limit Order Filled</div>
                      <div style={{ color: "#A1A1AA", fontSize: "12px", lineHeight: 1.4 }}>Your order to sell 500 XLM for USDC was completely filled on the DEX.</div>
                      <div style={{ color: "#71717A", fontSize: "11px", marginTop: "6px" }}>2 mins ago</div>
                    </div>
                  </div>
                  <div style={{ padding: "16px", display: "flex", gap: "12px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", marginTop: "6px" }} />
                    <div>
                      <div style={{ color: "#fff", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Liquidity Pool Seeded</div>
                      <div style={{ color: "#A1A1AA", fontSize: "12px", lineHeight: 1.4 }}>Successfully deposited 100 XLM into the AMM liquidity pool.</div>
                      <div style={{ color: "#71717A", fontSize: "11px", marginTop: "6px" }}>1 hour ago</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "12px", background: "#09090B", textAlign: "center", borderTop: "1px solid #27272A" }}>
                  <button style={{ background: "transparent", border: "none", color: "#F4F4F5", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>View All Activity</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile / Settings */}
          <Link href="/settings" style={{ padding: "6px 4px", color: "#A1A1AA", textDecoration: "none", fontSize: "16px", transition: "color 0.2s" }}>
            👤
          </Link>
        </div>
      </nav>
    </div>
  );
}
