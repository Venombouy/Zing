"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet-provider";
import { fetchContractBalance, buildGenericContractCall, submitTx } from "@/lib/stellar-launch";
import { Terminal, RefreshCw, Send, Plus } from "lucide-react";

interface ContractInfo {
  name: string;
  id: string;
}

export default function ContractsClient({ initialContracts }: { initialContracts: ContractInfo[] }) {
  const { pubKey, signTransaction } = useWallet();
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(true);

  // Generic Invoker State
  const [selectedContract, setSelectedContract] = useState(initialContracts[0]?.id || "");
  const [method, setMethod] = useState("");
  const [args, setArgs] = useState("");
  const [invoking, setInvoking] = useState(false);
  const [invokeMsg, setInvokeMsg] = useState<{ type: "ok" | "err", text: string } | null>(null);

  const fetchBalances = async () => {
    setLoadingBalances(true);
    const newBalances: Record<string, string> = {};
    for (const c of initialContracts) {
      newBalances[c.id] = await fetchContractBalance(c.id);
    }
    setBalances(newBalances);
    setLoadingBalances(false);
  };

  useEffect(() => {
    fetchBalances();
  }, [initialContracts]);

  const handleFund = async (contractId: string) => {
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${contractId}`);
      if (!res.ok) throw new Error("Friendbot failed");
      await fetchBalances();
      alert("Contract funded successfully!");
    } catch (e: any) {
      alert("Funding failed: " + e.message);
    }
  };

  const handleInvoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      setInvokeMsg({ type: "err", text: "Please connect your wallet first." });
      return;
    }
    if (!method.trim()) return;

    setInvoking(true);
    setInvokeMsg(null);
    try {
      setInvokeMsg({ type: "ok", text: "Building generic transaction..." });
      const xdr = await buildGenericContractCall(pubKey, selectedContract, method.trim(), args);

      setInvokeMsg({ type: "ok", text: "Please sign in Freighter..." });
      const signedXdr = await signTransaction(xdr);

      setInvokeMsg({ type: "ok", text: "Submitting to Soroban RPC..." });
      const res = await submitTx(signedXdr);

      setInvokeMsg({ type: "ok", text: `Success! Transaction Hash: ${res.hash}` });
      setMethod("");
      setArgs("");
    } catch (err: any) {
      console.error(err);
      setInvokeMsg({ type: "err", text: `Invocation failed: ${err.message || err}` });
    } finally {
      setInvoking(false);
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "var(--font-geist-sans)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Smart Contracts Hub</h1>
          <p style={{ fontSize: "13px", color: "#A1A1AA" }}>Manage deployed Soroban contracts, view native XLM balances, and invoke methods.</p>
        </div>
        <button 
          onClick={fetchBalances} 
          disabled={loadingBalances}
          style={{ padding: "8px 16px", background: "#27272A", color: "#fff", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}
        >
          <RefreshCw size={16} className={loadingBalances ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column: Contracts List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal size={16} /> Registry
          </h2>
          {initialContracts.map((c) => (
            <div key={c.id} style={{ background: "rgba(17,17,19,0.5)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#F4F4F5" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", color: "#71717A", fontFamily: "var(--font-geist-mono)", marginTop: "4px" }}>{c.id}</div>
                </div>
                <button
                  onClick={() => { setSelectedContract(c.id); setMethod(""); setArgs(""); }}
                  style={{ background: selectedContract === c.id ? "#3B82F6" : "rgba(255,255,255,0.05)", color: selectedContract === c.id ? "#fff" : "#A1A1AA", padding: "4px 12px", borderRadius: "16px", fontSize: "11px", border: "none", cursor: "pointer" }}
                >
                  Select
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#09090B", padding: "10px", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#52525B", textTransform: "uppercase" }}>Native Balance</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#10B981", fontFamily: "var(--font-geist-mono)" }}>
                    {loadingBalances ? "..." : (parseInt(balances[c.id] || "0") / 1e7).toFixed(2)} XLM
                  </div>
                </div>
                {(balances[c.id] === "0" || !balances[c.id]) && !loadingBalances && (
                  <button 
                    onClick={() => handleFund(c.id)}
                    style={{ background: "#F59E0B", color: "#000", fontSize: "11px", fontWeight: 600, padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Plus size={14} /> Fund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Generic Invoker */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
            <Send size={16} /> Generic Invoker
          </h2>
          <div style={{ background: "rgba(17,17,19,0.5)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "#A1A1AA", marginBottom: "20px", lineHeight: 1.5, background: "rgba(59,130,246,0.1)", padding: "10px", borderRadius: "6px", borderLeft: "3px solid #3B82F6" }}>
              Use this tool to interact dynamically with the selected smart contract. Arguments should be comma-separated. E.g., for launch_token: <strong>"My Token", "MTK", 1000000</strong>
            </div>

            <form onSubmit={handleInvoke} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#71717A", textTransform: "uppercase", marginBottom: "6px" }}>Target Contract ID</label>
                <input 
                  type="text" 
                  value={selectedContract} 
                  onChange={e => setSelectedContract(e.target.value)}
                  style={{ width: "100%", background: "#09090B", border: "1px solid #27272A", padding: "10px", borderRadius: "6px", color: "#F4F4F5", fontSize: "12px", fontFamily: "var(--font-geist-mono)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#71717A", textTransform: "uppercase", marginBottom: "6px" }}>Method Name *</label>
                <input 
                  type="text" 
                  required
                  value={method} 
                  onChange={e => setMethod(e.target.value)}
                  placeholder="e.g. initialize"
                  style={{ width: "100%", background: "#18181B", border: "1px solid #27272A", padding: "10px", borderRadius: "6px", color: "#F4F4F5", fontSize: "13px", fontFamily: "var(--font-geist-mono)", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#71717A", textTransform: "uppercase", marginBottom: "6px" }}>Arguments (Comma-Separated)</label>
                <textarea 
                  rows={3}
                  value={args} 
                  onChange={e => setArgs(e.target.value)}
                  placeholder={'e.g. "Name", "SYM", 100000'}
                  style={{ width: "100%", background: "#18181B", border: "1px solid #27272A", padding: "10px", borderRadius: "6px", color: "#F4F4F5", fontSize: "13px", fontFamily: "var(--font-geist-mono)", outline: "none", resize: "vertical" }}
                />
              </div>

              <button 
                type="submit"
                disabled={invoking}
                style={{ background: invoking ? "#27272A" : "#F4F4F5", color: invoking ? "#A1A1AA" : "#09090B", padding: "12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, border: "none", cursor: invoking ? "not-allowed" : "pointer", marginTop: "8px" }}
              >
                {invoking ? "Invoking..." : "Simulate & Execute"}
              </button>

              {invokeMsg && (
                <div style={{ marginTop: "8px", padding: "12px", background: invokeMsg.type === "ok" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: invokeMsg.type === "ok" ? "#10B981" : "#EF4444", borderRadius: "6px", fontSize: "12px", border: `1px solid ${invokeMsg.type === "ok" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}` }}>
                  {invokeMsg.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
