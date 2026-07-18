"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet-provider";
import { useToast } from "@/components/toast-provider";
import { createAndFundIssuer, buildTrustlineTx, submitTx, buildAndSignMintTx } from "@/lib/stellar-launch";
import { Networks } from "@stellar/stellar-sdk";
import { supabase } from "@/lib/supabase";

export default function LaunchZonePage() {
  const { pubKey, signTransaction } = useWallet();
  const { showToast } = useToast();
  
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [tokenType, setTokenType] = useState<"sac" | "classic">("sac");
  const [chains, setChains] = useState<string[]>([]);
  
  const [isLaunching, setIsLaunching] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [launchResult, setLaunchResult] = useState<{ issuer: string; asset: string } | null>(null);

  const toggleChain = (c: string) => {
    if (chains.includes(c)) {
      setChains(chains.filter((x) => x !== c));
    } else {
      setChains([...chains, c]);
    }
  };

  const handleLaunch = async () => {
    if (!pubKey) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!name || !symbol || !supply) {
      showToast("Please fill in all required token details.", "error");
      return;
    }
    
    // Quick validation
    if (symbol.length > 12) {
      showToast("Symbol must be 12 characters or less.", "error");
      return;
    }
    if (Number(supply) <= 0) {
      showToast("Supply must be greater than 0.", "error");
      return;
    }

    setIsLaunching(true);
    setLaunchResult(null);
    try {
      // 1. Create and Fund Issuer
      setStatusText("Generating and funding Issuer account...");
      const issuerKp = await createAndFundIssuer();
      
      // 2. Build and sign Trustline Tx
      setStatusText("Waiting for wallet signature (Trustline)...");
      const trustlineXdr = await buildTrustlineTx(pubKey, symbol, issuerKp.publicKey());
      const signedTrustlineXdr = await signTransaction(trustlineXdr, Networks.TESTNET);
      
      setStatusText("Submitting Trustline to Stellar...");
      await submitTx(signedTrustlineXdr);
      
      // 3. Build, sign (with issuer), and submit Mint Tx
      setStatusText("Minting supply and locking Issuer...");
      const mintXdr = await buildAndSignMintTx(issuerKp, pubKey, symbol, supply);
      await submitTx(mintXdr);

      setStatusText("Saving token details...");
      if (supabase) {
        await supabase.from("projects").insert({
          name: name || symbol,
          symbol: symbol,
          supply: parseFloat(supply),
          metadata: { issuer: issuerKp.publicKey(), type: tokenType },
          category: "Token",
          deployment_type: "stellar"
        });
      }
      
      setStatusText("Launch Complete!");
      showToast(`Successfully launched ${supply} ${symbol}!`, "success");
      setLaunchResult({ issuer: issuerKp.publicKey(), asset: symbol });
    } catch (e: any) {
      console.error(e);
      showToast(`Launch failed: ${e.message || "Unknown error"}`, "error");
    } finally {
      setIsLaunching(false);
      if (statusText !== "Launch Complete!") {
        setStatusText("");
      }
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px", fontFamily: "var(--font-geist-sans)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#fff", marginBottom: "8px", letterSpacing: "-0.5px" }}>
            LaunchZone
          </h1>
          <p style={{ color: "#A1A1AA", fontSize: "16px" }}>Deploy Stellar native assets and Soroban smart tokens.</p>
        </div>
        <Link href="/dashboard" style={{ background: "#27272A", padding: "10px 20px", borderRadius: "6px", color: "#F4F4F5", textDecoration: "none", fontSize: "14px", fontWeight: 500, transition: "background 0.2s" }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "40px" }}>
        {/* Launch Form */}
        <div style={{ background: "#111113", borderRadius: "12px", border: "1px solid #27272A", padding: "40px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", marginBottom: "32px", letterSpacing: "-0.2px" }}>Token Configuration</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", color: "#A1A1AA", marginBottom: "8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Token Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Agent Zero" style={{ width: "100%", background: "#09090B", border: "1px solid #3F3F46", padding: "14px 16px", borderRadius: "6px", color: "#fff", fontSize: "15px", outline: "none" }} />
              </div>
              <div style={{ width: "160px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#A1A1AA", marginBottom: "8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Symbol</label>
                <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AGZ" maxLength={12} style={{ width: "100%", background: "#09090B", border: "1px solid #3F3F46", padding: "14px 16px", borderRadius: "6px", color: "#fff", fontSize: "15px", outline: "none" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#A1A1AA", marginBottom: "8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Supply</label>
              <input type="number" value={supply} onChange={(e) => setSupply(e.target.value)} placeholder="1000000000" style={{ width: "100%", background: "#09090B", border: "1px solid #3F3F46", padding: "14px 16px", borderRadius: "6px", color: "#fff", fontSize: "15px", outline: "none" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#A1A1AA", marginBottom: "8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Architecture</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div onClick={() => setTokenType("sac")} style={{ background: tokenType === "sac" ? "#F4F4F5" : "#09090B", border: `1px solid ${tokenType === "sac" ? "#F4F4F5" : "#3F3F46"}`, padding: "20px", borderRadius: "8px", cursor: "pointer", transition: "all 0.1s" }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: tokenType === "sac" ? "#000" : "#fff", marginBottom: "4px" }}>Soroban Token</div>
                  <div style={{ fontSize: "13px", color: tokenType === "sac" ? "#52525B" : "#A1A1AA" }}>Full programmability</div>
                </div>
                <div onClick={() => setTokenType("classic")} style={{ background: tokenType === "classic" ? "#F4F4F5" : "#09090B", border: `1px solid ${tokenType === "classic" ? "#F4F4F5" : "#3F3F46"}`, padding: "20px", borderRadius: "8px", cursor: "pointer", transition: "all 0.1s" }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: tokenType === "classic" ? "#000" : "#fff", marginBottom: "4px" }}>Classic Asset</div>
                  <div style={{ fontSize: "13px", color: tokenType === "classic" ? "#52525B" : "#A1A1AA" }}>Native performance</div>
                </div>
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#A1A1AA", marginBottom: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Cross-Chain Mirroring</label>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {["Arbitrum", "Base", "Solana", "Near"].map(chain => {
                  const isActive = chains.includes(chain);
                  return (
                    <div onClick={() => toggleChain(chain)} key={chain} style={{ padding: "8px 16px", background: isActive ? "#3B82F6" : "transparent", border: `1px solid ${isActive ? "#3B82F6" : "#3F3F46"}`, borderRadius: "4px", fontSize: "14px", fontWeight: 500, color: isActive ? "#fff" : "#A1A1AA", cursor: "pointer" }}>
                      {chain}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={handleLaunch} 
              disabled={isLaunching || !pubKey} 
              style={{ 
                background: isLaunching ? "#3F3F46" : !pubKey ? "#27272A" : "#F4F4F5", 
                color: isLaunching || !pubKey ? "#A1A1AA" : "#000", 
                padding: "16px", 
                borderRadius: "6px", 
                fontSize: "15px", 
                fontWeight: 600, 
                border: "none", 
                cursor: isLaunching || !pubKey ? "not-allowed" : "pointer", 
                marginTop: "16px",
                transition: "all 0.2s"
              }}
            >
              {!pubKey ? "Connect Wallet to Launch" : isLaunching ? "Deploying..." : "Deploy to Network"}
            </button>
            
            {statusText && (
              <div style={{ fontSize: "14px", color: "#10B981", textAlign: "center", fontWeight: 500, marginTop: "-8px" }}>
                {statusText}
              </div>
            )}
            
            {launchResult && (
              <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", marginTop: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#10B981", marginBottom: "8px" }}>Deployment Successful</div>
                <div style={{ fontSize: "13px", color: "#A1A1AA", marginBottom: "4px" }}>Asset: {launchResult.asset}</div>
                <div style={{ fontSize: "13px", color: "#A1A1AA", fontFamily: "var(--font-geist-mono)", wordBreak: "break-all" }}>Issuer: {launchResult.issuer}</div>
                <a href={`https://stellar.expert/explorer/testnet/account/${launchResult.issuer}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "12px", color: "#3B82F6", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>
                  View on Stellar Expert ↗
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "#111113", borderRadius: "12px", border: "1px solid #27272A", padding: "32px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "24px" }}>Network Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }}></div>
                <div>
                  <div style={{ color: "#F4F4F5", fontSize: "14px", fontWeight: 500 }}>Stellar Testnet</div>
                  <div style={{ color: "#A1A1AA", fontSize: "13px", marginTop: "2px" }}>Operational</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3B82F6" }}></div>
                <div>
                  <div style={{ color: "#F4F4F5", fontSize: "14px", fontWeight: 500 }}>Soroban RPC</div>
                  <div style={{ color: "#A1A1AA", fontSize: "13px", marginTop: "2px" }}>Synced</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#111113", borderRadius: "12px", border: "1px solid #27272A", padding: "32px" }}>
             <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>Social Booster</h3>
             <p style={{ fontSize: "14px", color: "#A1A1AA", lineHeight: 1.6 }}>Assets deployed via LaunchZone are automatically indexed by Zing's Social Booster contracts, ready for community campaigns.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
