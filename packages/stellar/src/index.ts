/**
 * Zing — @zing/stellar
 *
 * Stellar/Horizon wrapper functions.
 * Target: Stellar TESTNET only.
 *
 * SDK version: @stellar/stellar-sdk@13.1.0
 *
 * Verified SDK exports used in this file:
 *   Keypair            — class; Keypair.random(), Keypair.fromSecret(secret)
 *   kp.publicKey()     — method → G… string
 *   kp.secret()        — method → S… string
 *   kp.sign(data)      — method → Buffer (used internally by transaction.sign)
 *   Horizon.Server     — class; constructor(url: string)
 *   server.loadAccount(publicKey) — async method → AccountResponse
 *   server.orderbook(base, counter).limit(n).call() → OrderbookRecord
 *   server.submitTransaction(tx)  — async method → SubmitTransactionResponse
 *   Operation.changeTrust({asset, limit?}) — static factory → xdr.Operation
 *   TransactionBuilder(account, {fee, networkPassphrase}) — class
 *   builder.addOperation(op)    — method → TransactionBuilder
 *   builder.setTimeout(n)       — method → TransactionBuilder
 *   builder.build()             — method → Transaction
 *   transaction.sign(keypair)   — method → void
 *   transaction.toXDR()         — method → base64 envelope string
 *   new Transaction(xdr, passphrase) — constructor, parses envelope XDR
 *   Asset.native()              — static → Asset (XLM)
 *   new Asset(code, issuer)     — constructor → Asset
 *   asset.isNative()            — method → boolean
 *   asset.getCode()             — method → string
 *   asset.getIssuer()           — method → string
 *   asset.getAssetType()        — method → 'native' | 'credit_alphanum4' | 'credit_alphanum12'
 *   Networks.TESTNET            — string constant (passphrase)
 *
 * Type names verified from SDK .d.ts files:
 *   HorizonApi.BalanceLineNative          (horizon_api.d.ts:68)
 *   HorizonApi.BalanceLineAsset           (horizon_api.d.ts:85)
 *   HorizonApi.SubmitTransactionResponse  (horizon_api.d.ts:12)
 *   ServerApi.OrderbookRecord             (server_api.d.ts:228)
 */

import {
  Keypair,
  Horizon,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Transaction,
} from "@stellar/stellar-sdk";

// ─── Constants ─────────────────────────────────────────────────────────────────

export const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/**
 * Circle USDC issuer on Stellar TESTNET.
 * Source: https://developers.circle.com/stablecoins/cctp-getting-started
 * This is the testnet issuer address — do NOT use on mainnet.
 */
export const TESTNET_USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

// ─── Application-level Types ───────────────────────────────────────────────────

export interface ZingKeypair {
  publicKey: string;
  secret: string;
}

export interface ZingBalance {
  assetType: string;       // 'native' | 'credit_alphanum4' | 'credit_alphanum12' | 'liquidity_pool_shares'
  assetCode?: string;
  assetIssuer?: string;
  balance: string;
}

export interface ZingTrustline {
  assetCode: string;
  assetIssuer: string;
  balance: string;
  limit: string;
}

export interface ZingOrderBook {
  bids: Array<{ price: string; amount: string }>;
  asks: Array<{ price: string; amount: string }>;
  base: { assetType: string; assetCode?: string };
  counter: { assetType: string; assetCode?: string; assetIssuer?: string };
}

// ─── Horizon Client ─────────────────────────────────────────────────────────────

/**
 * Returns a Horizon.Server instance pointed at TESTNET.
 * Horizon.Server is the correct class in @stellar/stellar-sdk v13
 * (confirmed via `node -e "const {Horizon} = require('@stellar/stellar-sdk'); console.log(typeof Horizon.Server)"`)
 */
export function getHorizonServer(): Horizon.Server {
  return new Horizon.Server(HORIZON_TESTNET_URL);
}

// ─── Keypair Functions ──────────────────────────────────────────────────────────

/**
 * Generate a new random Stellar keypair.
 * Uses Keypair.random() — verified method in @stellar/stellar-sdk v13.
 *
 * SECURITY: The secret must never leave the client. Caller is responsible
 * for never transmitting this to any server or storing it in Supabase.
 */
export function createKeypair(): ZingKeypair {
  const kp = Keypair.random();
  return {
    publicKey: kp.publicKey(),
    secret: kp.secret(),
  };
}

/**
 * Restore a Stellar Keypair from a secret key (S…).
 * Uses Keypair.fromSecret(secret) — verified method in @stellar/stellar-sdk v13.
 *
 * Throws StrKey.InvalidVersionByte if the secret is not a valid Stellar secret.
 */
export function importKeypairFromSecret(secret: string): ZingKeypair {
  const kp = Keypair.fromSecret(secret);
  return {
    publicKey: kp.publicKey(),
    secret: kp.secret(),
  };
}

// ─── Account Functions ──────────────────────────────────────────────────────────

/**
 * Fetch all balances for a Stellar public key on TESTNET.
 * Uses server.loadAccount(publicKey) — verified method in @stellar/stellar-sdk v13.
 *
 * Throws Horizon.NotFoundError if the account has never been funded.
 *
 * @param publicKey  G… Stellar public key
 */
export async function getBalances(publicKey: string): Promise<ZingBalance[]> {
  const server = getHorizonServer();
  const account = await server.loadAccount(publicKey);

  return account.balances.map((b) => {
    if (b.asset_type === "native") {
      const native = b as Horizon.HorizonApi.BalanceLineNative;
      return {
        assetType: native.asset_type,
        balance: native.balance,
      };
    }
    if (
      b.asset_type === "credit_alphanum4" ||
      b.asset_type === "credit_alphanum12"
    ) {
      const line = b as Horizon.HorizonApi.BalanceLineAsset;
      return {
        assetType: line.asset_type,
        assetCode: line.asset_code,
        assetIssuer: line.asset_issuer,
        balance: line.balance,
      };
    }
    // liquidity_pool_shares — no code/issuer
    return {
      assetType: b.asset_type,
      balance: b.balance,
    };
  });
}

/**
 * List all non-native, non-pool trustlines on an account.
 * Filters getBalances() output for credit_alphanum4/12 entries.
 *
 * Uses server.loadAccount() — verified.
 *
 * @param publicKey  G… Stellar public key
 */
export async function listTrustlines(publicKey: string): Promise<ZingTrustline[]> {
  const server = getHorizonServer();
  const account = await server.loadAccount(publicKey);

  return account.balances
    .filter(
      (b) =>
        b.asset_type === "credit_alphanum4" ||
        b.asset_type === "credit_alphanum12"
    )
    .map((b) => {
      const line = b as Horizon.HorizonApi.BalanceLineAsset;
      return {
        assetCode: line.asset_code,
        assetIssuer: line.asset_issuer,
        balance: line.balance,
        limit: line.limit,
      };
    });
}

// ─── Trustline Operations ───────────────────────────────────────────────────────

/**
 * Build and sign a changeTrust transaction to add a trustline.
 * Returns the signed transaction as a base64 XDR string.
 * The caller is responsible for submitting it (use submitTransactionXDR).
 *
 * SECURITY: signerSecret is used only in-memory for signing; never store it.
 *
 * SDK methods used (all verified):
 *   server.loadAccount()               — loads account + sequence number
 *   new TransactionBuilder(acct, opts) — initializes transaction
 *   builder.addOperation(op)           — adds changeTrust op
 *   Operation.changeTrust({asset})     — builds the changeTrust operation
 *   builder.setTimeout(seconds)        — sets transaction time window
 *   builder.build()                    — finalizes transaction
 *   tx.sign(keypair)                   — signs with keypair
 *   tx.toXDR()                         — returns base64 envelope XDR string
 *
 * @param signerSecret  S… secret key of the account adding the trustline
 * @param assetCode     Asset code, e.g. "USDC"
 * @param assetIssuer   G… public key of the asset issuer
 * @param limit         Optional trust limit (string, e.g. "10000"); omit for max
 * @returns Signed transaction XDR string
 */
export async function buildAddTrustlineXDR(
  signerSecret: string,
  assetCode: string,
  assetIssuer: string,
  limit?: string
): Promise<string> {
  const server = getHorizonServer();
  const keypair = Keypair.fromSecret(signerSecret);
  const account = await server.loadAccount(keypair.publicKey());

  const asset = new Asset(assetCode, assetIssuer);

  const builder = new TransactionBuilder(account, {
    fee: "100", // 100 stroops = 0.00001 XLM base fee
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset,
        ...(limit !== undefined ? { limit } : {}),
      })
    )
    .setTimeout(30); // 30-second validity window

  const tx = builder.build();
  tx.sign(keypair);
  // tx.toXDR() returns a base64-encoded XDR envelope string
  return tx.toXDR();
}

/**
 * Submit a signed transaction XDR string to Horizon TESTNET.
 * Returns the real Horizon SubmitTransactionResponse on success.
 * Throws the real Horizon error on failure — no error suppression.
 *
 * Uses:
 *   new Transaction(xdr, passphrase) — parses signed XDR into Transaction object
 *   server.submitTransaction(tx)     — submits to Horizon; verified method
 *
 * @param xdr  Base64-encoded signed transaction envelope (from tx.toXDR())
 */
export async function submitTransactionXDR(
  xdr: string
): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
  const server = getHorizonServer();
  // new Transaction() is the correct constructor for parsing a signed XDR envelope
  const tx = new Transaction(xdr, NETWORK_PASSPHRASE);
  return server.submitTransaction(tx);
}

// ─── Market Data ────────────────────────────────────────────────────────────────

/**
 * Fetch the XLM/USDC order book from Horizon TESTNET.
 *
 * Uses:
 *   Asset.native()                             — XLM; verified static method
 *   new Asset(code, issuer)                    — USDC asset
 *   server.orderbook(base, counter).limit(n).call() — verified call chain
 *
 * The OrderbookRecord.base and .counter are typed as Asset instances in the SDK.
 * Using Asset class methods: isNative(), getCode(), getIssuer(), getAssetType()
 * — all verified via `node -e` REPL test above.
 *
 * @param depth  Number of bid/ask levels to return (default: 10)
 */
export async function getXLMUSDCOrderBook(depth = 10): Promise<ZingOrderBook> {
  const server = getHorizonServer();
  const baseAsset = Asset.native();
  const counterAsset = new Asset("USDC", TESTNET_USDC_ISSUER);

  const ob = await server.orderbook(baseAsset, counterAsset).limit(depth).call();

  /**
   * RUNTIME NOTE: Despite ServerApi.OrderbookRecord typing ob.base/ob.counter
   * as Asset class instances in the SDK .d.ts, the actual Horizon JSON response
   * returns plain objects:
   *   base:    { asset_type: 'native' }
   *   counter: { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: '...' }
   *
   * This was confirmed by live testnet call:
   *   node -e "... .call().then(r => console.log('base keys:', Object.keys(r.base)))"
   *   Output: base keys: [ 'asset_type' ]
   *
   * We cast to `unknown` first, then to the documented plain-object shape.
   */
  const rawBase = ob.base as unknown as { asset_type: string; asset_code?: string };
  const rawCounter = ob.counter as unknown as {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
  };

  return {
    bids: ob.bids.map((b) => ({ price: b.price, amount: b.amount })),
    asks: ob.asks.map((a) => ({ price: a.price, amount: a.amount })),
    base: {
      assetType: rawBase.asset_type,
      assetCode: rawBase.asset_code,
    },
    counter: {
      assetType: rawCounter.asset_type,
      assetCode: rawCounter.asset_code,
      assetIssuer: rawCounter.asset_issuer,
    },
  };
}
