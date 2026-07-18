/**
 * Zing — Stellar integration tests
 * Target: TESTNET only.
 * All assertions use real Horizon responses — no mocks.
 */

import {
  createKeypair,
  importKeypairFromSecret,
  getBalances,
  listTrustlines,
  getXLMUSDCOrderBook,
  TESTNET_USDC_ISSUER,
} from "../index";

// ─── Test runner (no test framework dependency) ──────────────────────────────

let passed = 0;
let failed = 0;
const results: string[] = [];

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    results.push(`  ✅ ${label}`);
  } else {
    failed++;
    results.push(`  ❌ ${label}${detail ? `: ${detail}` : ""}`);
  }
}

async function run() {
  console.log("\n=== @zing/stellar — Testnet Integration Tests ===\n");

  // ── Test 1: createKeypair ────────────────────────────────────────────────
  console.log("1. createKeypair()");
  const kp = createKeypair();
  assert("publicKey starts with G", kp.publicKey.startsWith("G"));
  assert("publicKey is 56 chars", kp.publicKey.length === 56);
  assert("secret starts with S", kp.secret.startsWith("S"));
  assert("secret is 56 chars", kp.secret.length === 56);
  results.forEach((r) => console.log(r));
  results.length = 0;

  // ── Test 2: importKeypairFromSecret ──────────────────────────────────────
  console.log("\n2. importKeypairFromSecret()");
  const reimported = importKeypairFromSecret(kp.secret);
  assert(
    "reimported publicKey matches original",
    reimported.publicKey === kp.publicKey
  );
  let threw = false;
  try {
    importKeypairFromSecret("INVALID_SECRET");
  } catch {
    threw = true;
  }
  assert("throws on invalid secret", threw);
  results.forEach((r) => console.log(r));
  results.length = 0;

  // ── Test 3: getXLMUSDCOrderBook (LIVE TESTNET) ──────────────────────────
  console.log("\n3. getXLMUSDCOrderBook() — LIVE TESTNET CALL");
  let ob: Awaited<ReturnType<typeof getXLMUSDCOrderBook>> | null = null;
  let orderBookError: unknown = null;
  try {
    ob = await getXLMUSDCOrderBook(5);
  } catch (e) {
    orderBookError = e;
  }
  if (orderBookError) {
    failed++;
    console.log(`  ❌ Order book call failed: ${(orderBookError as Error).message}`);
  } else if (ob) {
    assert("bids is an array", Array.isArray(ob.bids));
    assert("asks is an array", Array.isArray(ob.asks));
    assert("base asset_type is native", ob.base.assetType === "native");
    assert("counter assetCode is USDC", ob.counter.assetCode === "USDC");
    assert(
      "counter assetIssuer matches testnet issuer",
      ob.counter.assetIssuer === TESTNET_USDC_ISSUER
    );
    results.forEach((r) => console.log(r));
    results.length = 0;

    console.log("\n  📡 LIVE HORIZON TESTNET RESPONSE (XLM/USDC order book, depth=5):");
    console.log(JSON.stringify(ob, null, 4));
  }

  // ── Test 4: getBalances on a known funded testnet account ────────────────
  // Using the Stellar testnet Friendbot-funded demo account from Stellar docs.
  // This account exists on testnet for testing purposes.
  console.log("\n4. getBalances() — LIVE TESTNET CALL (Stellar testnet demo account)");
  // We'll fund a fresh account via friendbot to guarantee it exists
  const testKp = createKeypair();
  let fundError: unknown = null;
  try {
    await fetch(
      `https://friendbot.stellar.org?addr=${testKp.publicKey}`
    );
  } catch (e) {
    fundError = e;
  }

  if (fundError) {
    console.log("  ⚠️  Friendbot unavailable; skipping balance test");
  } else {
    // wait a moment for ledger close
    await new Promise((r) => setTimeout(r, 4000));
    let balances: Awaited<ReturnType<typeof getBalances>> | null = null;
    let balanceError: unknown = null;
    try {
      balances = await getBalances(testKp.publicKey);
    } catch (e) {
      balanceError = e;
    }
    if (balanceError) {
      failed++;
      console.log(`  ❌ getBalances failed: ${(balanceError as Error).message}`);
    } else if (balances) {
      assert("balances is an array", Array.isArray(balances));
      const xlm = balances.find((b) => b.assetType === "native");
      assert("XLM native balance exists", !!xlm);
      assert(
        "XLM balance is a numeric string",
        !!xlm && !isNaN(parseFloat(xlm.balance))
      );
      results.forEach((r) => console.log(r));
      results.length = 0;
      console.log("\n  📡 LIVE HORIZON TESTNET RESPONSE (Friendbot-funded account balances):");
      console.log(JSON.stringify(balances, null, 4));
    }
  }

  // ── Test 5: listTrustlines ────────────────────────────────────────────────
  console.log("\n5. listTrustlines() — same funded account, no custom trustlines yet");
  if (!fundError) {
    let trustlines: Awaited<ReturnType<typeof listTrustlines>> | null = null;
    try {
      trustlines = await listTrustlines(testKp.publicKey);
    } catch (e) {
      console.log(`  ❌ listTrustlines failed: ${(e as Error).message}`);
    }
    if (trustlines !== null) {
      assert("trustlines is an array", Array.isArray(trustlines));
      assert(
        "fresh account has no trustlines",
        trustlines.length === 0
      );
      results.forEach((r) => console.log(r));
      results.length = 0;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
