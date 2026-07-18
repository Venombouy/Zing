/**
 * @zing/stellar — browser-safe Horizon client
 *
 * This file is imported by BOTH server components and client components.
 * The Stellar SDK ships browser-compatible bundles via its package.json
 * "browser" field, so this works in both environments.
 *
 * All calls target Stellar TESTNET. No private keys are sent server-side.
 */

// We import from the SDK's ESM entry which is browser-safe.
// @stellar/stellar-sdk v13 ships a full browser build via the "browser" field
// in its package.json, including crypto shims via TweetNaCl.
import {
  Horizon,
  Asset,
  Networks,
  Keypair,
  TransactionBuilder,
  Operation,
  Transaction,
} from "@stellar/stellar-sdk";

// ─── Constants ──────────────────────────────────────────────────────
export const HORIZON_URL         = "https://horizon-testnet.stellar.org";
export const NETWORK             = Networks.TESTNET;
export const TESTNET_USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const XLM  = Asset.native();
export const USDC = new Asset("USDC", TESTNET_USDC_ISSUER);

function getServer() {
  return new Horizon.Server(HORIZON_URL);
}

// ─── Types ──────────────────────────────────────────────────────────
export interface OrderBookLevel { price: string; amount: string }
export interface OrderBook      { bids: OrderBookLevel[]; asks: OrderBookLevel[] }

export interface TradeRecord {
  id:                string;
  ledger_close_time: string;
  base_amount:       string;
  counter_amount:    string;
  base_is_seller:    boolean;
  price:             { n: string; d: string };
}

export interface Balance {
  assetType:   string;
  assetCode?:  string;
  assetIssuer?: string;
  balance:     string;
}

export interface TradeAgg {
  timestamp:      string;
  open:           string;
  high:           string;
  low:            string;
  close:          string;
  base_volume:    string;
  counter_volume: string;
  trade_count:    string;
}

// ─── Order Book ──────────────────────────────────────────────────────
export async function fetchOrderBook(depth = 15): Promise<OrderBook> {
  const ob = await getServer().orderbook(XLM, USDC).limit(depth).call();
  return {
    bids: ob.bids.map((b) => ({ price: b.price, amount: b.amount })),
    asks: ob.asks.map((a) => ({ price: a.price, amount: a.amount })),
  };
}

// ─── Recent Trades ───────────────────────────────────────────────────
export async function fetchRecentTrades(limit = 30): Promise<TradeRecord[]> {
  const result = await getServer()
    .trades()
    .forAssetPair(XLM, USDC)
    .order("desc")
    .limit(limit)
    .call();
  return result.records.map((r) => ({
    id:                r.id,
    ledger_close_time: r.ledger_close_time,
    base_amount:       r.base_amount,
    counter_amount:    r.counter_amount,
    base_is_seller:    r.base_is_seller,
    price:             r.price as { n: string; d: string },
  }));
}

// ─── Trade Aggregations (OHLCV) ──────────────────────────────────────
export async function fetchTradeAggregations(
  resolutionMs = 3600000,
  hoursBack    = 24
): Promise<TradeAgg[]> {
  const end   = Date.now();
  const start = end - hoursBack * 60 * 60 * 1000;
  try {
    const result = await getServer()
      .tradeAggregation(XLM, USDC, start, end, resolutionMs, 0)
      .order("asc")
      .limit(200)
      .call();
    return result.records.map((r) => ({
      timestamp:      String(r.timestamp),
      open:           r.open,
      high:           r.high,
      low:            r.low,
      close:          r.close,
      base_volume:    r.base_volume,
      counter_volume: r.counter_volume,
      trade_count:    String(r.trade_count),
    }));
  } catch {
    return [];
  }
}

// ─── Account Balances ────────────────────────────────────────────────
export async function fetchBalances(publicKey: string): Promise<Balance[]> {
  const account = await getServer().loadAccount(publicKey);
  return account.balances.map((b) => {
    if (b.asset_type === "native") {
      return { assetType: "native", balance: b.balance };
    }
    if (b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12") {
      const line = b as Horizon.HorizonApi.BalanceLineAsset;
      return { assetType: line.asset_type, assetCode: line.asset_code, assetIssuer: line.asset_issuer, balance: line.balance };
    }
    return { assetType: b.asset_type, balance: b.balance };
  });
}

// ─── Keypair (browser only) ──────────────────────────────────────────
export function generateTestnetKeypair(): { publicKey: string; secret: string } {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secret: kp.secret() };
}

export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Transaction Builders ────────────────────────────────────────────
export async function buildAddUSDCTrustlineXDR(signerSecret: string): Promise<string> {
  const kp      = Keypair.fromSecret(signerSecret);
  const account = await getServer().loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: NETWORK })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(30)
    .build();
  tx.sign(kp);
  return tx.toXDR();
}

export async function buildSwapXDR(params: {
  signerSecret: string;
  sendAsset:    Asset;
  sendAmount:   string;
  destAsset:    Asset;
  destMin:      string;
}): Promise<string> {
  const kp      = Keypair.fromSecret(params.signerSecret);
  const account = await getServer().loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, { fee: "200", networkPassphrase: NETWORK })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset:   params.sendAsset,
        sendAmount:  params.sendAmount,
        destination: kp.publicKey(),
        destAsset:   params.destAsset,
        destMin:     params.destMin,
        path:        [],
      })
    )
    .setTimeout(60)
    .build();
  tx.sign(kp);
  return tx.toXDR();
}

export async function submitXDR(xdr: string): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
  const tx = new Transaction(xdr, NETWORK);
  return getServer().submitTransaction(tx);
}

// ─── Price Helpers ───────────────────────────────────────────────────
export function getMidPrice(ob: OrderBook): string | null {
  if (!ob.bids.length || !ob.asks.length) return null;
  return ((parseFloat(ob.bids[0].price) + parseFloat(ob.asks[0].price)) / 2).toFixed(7);
}

export function getSpread(ob: OrderBook): string | null {
  if (!ob.bids.length || !ob.asks.length) return null;
  const bid = parseFloat(ob.bids[0].price);
  const ask = parseFloat(ob.asks[0].price);
  return (((ask - bid) / ask) * 100).toFixed(3);
}

export function fmt(n: string | number, decimals = 4): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(2) + "K";
  return v.toFixed(decimals);
}
