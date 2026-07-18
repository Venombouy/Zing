"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet-provider";
import { useToast } from "@/components/toast-provider";
import { Asset, Networks } from "@stellar/stellar-sdk";
import { getBalances, getSwapQuote, buildSwapTx, buildLiquidityPoolTx, TokenBalance } from "@/lib/stellar-trade";
import { submitTx } from "@/lib/stellar-launch";

const COMMON_ASSETS = [
  { code: "XLM", issuer: "", type: "native" },
  { code: "USDC", issuer: "GC3G7RAERYP3CDDVLIN4SJVCCQDJ6ZSY6X3AHP262XDMMBLSSG75LI66", type: "credit_alphanum4" } // Testnet USDC Dummy
];

export default function TradePage() {
  const { pubKey, signTransaction } = useWallet();
  const { showToast } = useToast();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  
  const [payAssetCode, setPayAssetCode] = useState("XLM");
  const [payAssetIssuer, setPayAssetIssuer] = useState("");
  
  const [recvAssetCode, setRecvAssetCode] = useState("USDC");
  const [recvAssetIssuer, setRecvAssetIssuer] = useState("GC3G7RAERYP3CDDVLIN4SJVCCQDJ6ZSY6X3AHP262XDMMBLSSG75LI66");

  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quotePath, setQuotePath] = useState<Asset[]>([]);

  const [quoteError, setQuoteError] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (pubKey) {
      getBalances(pubKey).then(setBalances);
    }
  }, [pubKey]);

  useEffect(() => {
    const fetchQuote = async () => {
      setQuoteError("");
      if (!payAmount || parseFloat(payAmount) <= 0) {
        setReceiveAmount("");
        setQuotePath([]);
        return;
      }

      if (payAssetCode !== "XLM" && (!payAssetIssuer || payAssetIssuer.length !== 56)) return;
      if (recvAssetCode !== "XLM" && (!recvAssetIssuer || recvAssetIssuer.length !== 56)) return;

      setIsQuoting(true);
      try {
        const pAsset = payAssetCode === "XLM" ? Asset.native() : new Asset(payAssetCode, payAssetIssuer);
        const rAsset = recvAssetCode === "XLM" ? Asset.native() : new Asset(recvAssetCode, recvAssetIssuer);
        
        const quote = await getSwapQuote(pAsset, payAmount, rAsset);
        setReceiveAmount(quote.destination_amount);
        
        // Map the path for the transaction builder
        const path = quote.path.map((p: any) => 
          p.asset_type === "native" ? Asset.native() : new Asset(p.asset_code, p.asset_issuer)
        );
        setQuotePath(path);
      } catch (e: any) {
        setReceiveAmount("");
        setQuotePath([]);
        setQuoteError(e.message || "Failed to fetch quote");
        console.error("Quote error:", e);
      } finally {
        setIsQuoting(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 600);
    return () => clearTimeout(debounce);
  }, [payAmount, payAssetCode, payAssetIssuer, recvAssetCode, recvAssetIssuer]);

  const handleSwap = async () => {
    if (!pubKey) return showToast("Connect wallet first", "error");
    try {
      setTxHash("");
      setIsSwapping(true);
      const pAsset = payAssetCode === "XLM" ? Asset.native() : new Asset(payAssetCode, payAssetIssuer);
      const rAsset = recvAssetCode === "XLM" ? Asset.native() : new Asset(recvAssetCode, recvAssetIssuer);
      
      // Calculate minAmountOut based on a 1% slippage tolerance
      let minAmountOut = (parseFloat(receiveAmount) * 0.99).toFixed(7);
      if (parseFloat(minAmountOut) <= 0) {
        minAmountOut = "0.0000001"; // Stellar requires a strictly positive number
      }

      showToast("Waiting for signature...", "info");
      const xdr = await buildSwapTx(pubKey, pAsset, rAsset, payAmount, minAmountOut, quotePath);
      const signedXdr = await signTransaction(xdr, Networks.TESTNET);
      
      showToast("Submitting to network...", "info");
      const res = await submitTx(signedXdr);
      setTxHash(res.hash);
      
      showToast("Swap successful!", "success");
      setPayAmount("");
      setReceiveAmount("");
      getBalances(pubKey).then(setBalances);
    } catch (e: any) {
      showToast(`Swap failed: ${e.message}`, "error");
    } finally {
      setIsSwapping(false);
    }
  };

  const selectableAssets = React.useMemo(() => {
    const assets = [...COMMON_ASSETS];
    balances.forEach(b => {
      if (b.asset_type !== "native") {
        if (!assets.find(a => a.code === b.asset_code && a.issuer === b.asset_issuer)) {
          assets.push({
            code: b.asset_code,
            issuer: b.asset_issuer!,
            type: b.asset_type
          });
        }
      }
    });
    return assets;
  }, [balances]);

  const getBalanceFor = (code: string, issuer: string) => {
    const bal = balances.find(b => 
      (b.asset_code === code && b.asset_issuer === issuer) || 
      (code === "XLM" && b.asset_type === "native")
    );
    return bal ? parseFloat(bal.balance).toFixed(2) : "0.00";
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px", fontFamily: "var(--font-geist-sans)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#fff", marginBottom: "8px", letterSpacing: "-0.5px" }}>
            Terminal
          </h1>
          <p style={{ color: "#A1A1AA", fontSize: "16px" }}>Execute real testnet swaps via Stellar DEX.</p>
        </div>
        <Link href="/dashboard" style={{ background: "#27272A", padding: "10px 20px", borderRadius: "6px", color: "#F4F4F5", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "40px", alignItems: "start" }}>
        {/* Left Column: Chart Area (simplified for real view) */}
        <div style={{ background: "#111113", borderRadius: "12px", border: "1px solid #27272A", padding: "40px", minHeight: "400px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Live Market Data</h2>
          <p style={{ color: "#A1A1AA", fontSize: "14px", textAlign: "center", maxWidth: "300px" }}>
            The terminal is now connected directly to the Stellar Horizon API. Quotes are fetched in real-time from the on-chain order books.
          </p>
        </div>

        {/* Right Column: Swap Interface */}
        <div style={{ background: "#111113", borderRadius: "12px", border: "1px solid #27272A", padding: "24px", display: "flex", flexDirection: "column" }}>
          
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid #27272A", paddingBottom: "16px" }}>
            <div style={{ flex: 1, padding: "8px", color: "#fff", fontWeight: 600, textAlign: "center", borderBottom: "2px solid #F4F4F5", cursor: "pointer" }}>Swap</div>
            <div style={{ flex: 1, padding: "8px", color: "#71717A", fontWeight: 500, textAlign: "center", cursor: "not-allowed" }}>Limit</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Pay Input */}
            <div style={{ background: "#09090B", borderRadius: "8px", padding: "16px", border: "1px solid #3F3F46" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#A1A1AA", fontSize: "13px", fontWeight: 500, textTransform: "uppercase" }}>Pay</span>
                <span style={{ color: "#A1A1AA", fontSize: "13px" }}>Bal: {getBalanceFor(payAssetCode, payAssetIssuer)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.0" style={{ flex: 1, background: "transparent", border: "none", fontSize: "24px", color: "#fff", outline: "none", width: "100%" }} />
                
                <select 
                  value={payAssetCode === "CUSTOM" ? "CUSTOM" : `${payAssetCode}:${payAssetIssuer}`} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "CUSTOM") {
                      setPayAssetCode("CUSTOM");
                      setPayAssetIssuer("");
                    } else {
                      const [code, issuer] = val.split(":");
                      setPayAssetCode(code);
                      setPayAssetIssuer(issuer);
                    }
                  }} 
                  style={{ background: "#27272A", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, outline: "none", cursor: "pointer", maxWidth: "120px" }}
                >
                  {selectableAssets.map((a, idx) => (
                    <option key={`pay-${idx}`} value={`${a.code}:${a.issuer}`}>
                      {a.code}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom...</option>
                </select>
              </div>
              {payAssetCode === "CUSTOM" && (
                <div style={{ marginTop: "12px" }}>
                  <input type="text" placeholder="Custom Asset Code" onChange={e => setPayAssetCode(e.target.value.toUpperCase())} style={{ width: "100%", background: "#111113", border: "1px solid #3F3F46", padding: "8px", borderRadius: "4px", color: "#fff", fontSize: "13px", marginBottom: "8px" }} />
                  <input type="text" placeholder="Issuer Public Key" value={payAssetIssuer} onChange={e => setPayAssetIssuer(e.target.value)} style={{ width: "100%", background: "#111113", border: "1px solid #3F3F46", padding: "8px", borderRadius: "4px", color: "#fff", fontSize: "13px" }} />
                </div>
              )}
            </div>

            {/* Receive Input */}
            <div style={{ background: "#09090B", borderRadius: "8px", padding: "16px", border: "1px solid #3F3F46" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#A1A1AA", fontSize: "13px", fontWeight: 500, textTransform: "uppercase" }}>Receive {isQuoting && "(Fetching...)"}</span>
                <span style={{ color: "#A1A1AA", fontSize: "13px" }}>Bal: {getBalanceFor(recvAssetCode, recvAssetIssuer)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input type="text" value={receiveAmount} readOnly placeholder="0.0" style={{ flex: 1, background: "transparent", border: "none", fontSize: "24px", color: isQuoting ? "#71717A" : "#fff", outline: "none", width: "100%" }} />
                
                <select 
                  value={recvAssetCode === "CUSTOM" ? "CUSTOM" : `${recvAssetCode}:${recvAssetIssuer}`} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "CUSTOM") {
                      setRecvAssetCode("CUSTOM");
                      setRecvAssetIssuer("");
                    } else {
                      const [code, issuer] = val.split(":");
                      setRecvAssetCode(code);
                      setRecvAssetIssuer(issuer);
                    }
                  }} 
                  style={{ background: "#27272A", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, outline: "none", cursor: "pointer", maxWidth: "120px" }}
                >
                  {selectableAssets.map((a, idx) => (
                    <option key={`recv-${idx}`} value={`${a.code}:${a.issuer}`}>
                      {a.code}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom...</option>
                </select>
              </div>
              {recvAssetCode === "CUSTOM" && (
                <div style={{ marginTop: "12px" }}>
                  <input type="text" placeholder="Custom Asset Code" onChange={e => setRecvAssetCode(e.target.value.toUpperCase())} style={{ width: "100%", background: "#111113", border: "1px solid #3F3F46", padding: "8px", borderRadius: "4px", color: "#fff", fontSize: "13px", marginBottom: "8px" }} />
                  <input type="text" placeholder="Issuer Public Key" value={recvAssetIssuer} onChange={e => setRecvAssetIssuer(e.target.value)} style={{ width: "100%", background: "#111113", border: "1px solid #3F3F46", padding: "8px", borderRadius: "4px", color: "#fff", fontSize: "13px" }} />
                </div>
              )}
            </div>

            {receiveAmount && !isQuoting && !quoteError && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginTop: "4px" }}>
                <span style={{ color: "#71717A", fontSize: "12px" }}>Max Slippage</span>
                <span style={{ color: "#A1A1AA", fontSize: "12px" }}>1.00%</span>
              </div>
            )}
            
            {quoteError && (
              <div style={{ color: "#EF4444", fontSize: "13px", padding: "0 8px", marginTop: "4px" }}>
                ⚠️ {quoteError}
              </div>
            )}

            {quoteError === "No liquidity path found for this swap." && (
              <button 
                onClick={async () => {
                  if (!pubKey) return showToast("Connect wallet first", "error");
                  try {
                    setIsSwapping(true);
                    const pAsset = payAssetCode === "XLM" ? Asset.native() : new Asset(payAssetCode, payAssetIssuer);
                    const rAsset = recvAssetCode === "XLM" ? Asset.native() : new Asset(recvAssetCode, recvAssetIssuer);
                    showToast("Waiting for signature...", "info");
                    
                    const rBal = balances.find(b => b.asset_code === rAsset.code && b.asset_issuer === rAsset.issuer);
                    const maxDepositB = rBal ? parseFloat(rBal.balance) : 0;
                    if (maxDepositB === 0) {
                      throw new Error(`You don't hold any ${rAsset.code} to seed the pool!`);
                    }
                    // Deposit either 1000 or 50% of their balance if they hold less than 1000
                    const depositB = Math.min(1000, maxDepositB * 0.5).toFixed(7);
                    
                    const xdr = await buildLiquidityPoolTx(pubKey, pAsset, rAsset, "100", depositB);
                    const signedXdr = await signTransaction(xdr, Networks.TESTNET);
                    showToast("Submitting to network...", "info");
                    const res = await submitTx(signedXdr);
                    setTxHash(res.hash);
                    showToast("Liquidity Pool Seeded! You can now swap.", "success");
                    setQuoteError("");
                    setPayAmount(""); 
                  } catch (e: any) {
                    let errMsg = e.message;
                    if (e.response?.data?.extras?.result_codes) {
                      const codes = e.response.data.extras.result_codes;
                      errMsg = `Tx: ${codes.transaction}, Ops: ${codes.operations?.join(", ")}`;
                    }
                    showToast(`Failed to seed: ${errMsg}`, "error");
                  } finally {
                    setIsSwapping(false);
                  }
                }}
                disabled={isSwapping || !pubKey}
                style={{
                  background: "#10B981", color: "#000", padding: "12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", marginTop: "8px"
                }}
              >
                Seed Initial Liquidity Pool
              </button>
            )}
          </div>

          <button 
            onClick={handleSwap} 
            disabled={isSwapping || !pubKey || !receiveAmount || isQuoting || !!quoteError}
            style={{ 
              background: isSwapping || !pubKey || !receiveAmount || !!quoteError ? "#3F3F46" : "#F4F4F5", 
              color: isSwapping || !pubKey || !receiveAmount || !!quoteError ? "#A1A1AA" : "#000", 
              padding: "16px", 
              borderRadius: "6px", 
              fontSize: "15px", 
              fontWeight: 600, 
              border: "none", 
              cursor: isSwapping || !pubKey || !receiveAmount || !!quoteError ? "not-allowed" : "pointer", 
              marginTop: "24px", 
              transition: "all 0.2s" 
            }}>
            {!pubKey ? "Connect Wallet" : isSwapping ? "Swapping..." : quoteError ? "No Liquidity" : receiveAmount ? "Submit Trade" : "Enter Amount"}
          </button>
          
          {txHash && (
            <div style={{ marginTop: "16px", padding: "16px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)", textAlign: "center" }}>
              <h4 style={{ color: "#10B981", margin: "0 0 8px 0", fontSize: "14px" }}>Transaction Successful!</h4>
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: "#3B82F6", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                View on Stellar Expert
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
