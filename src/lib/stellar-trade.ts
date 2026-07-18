import { Asset, TransactionBuilder, Operation, Networks } from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export interface TokenBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

/**
 * Fetch all balances for a given public key.
 */
export async function getBalances(pubKey: string): Promise<TokenBalance[]> {
  try {
    const account = await server.loadAccount(pubKey);
    return account.balances.map((b: any) => ({
      asset_type: b.asset_type,
      asset_code: b.asset_code,
      asset_issuer: b.asset_issuer,
      balance: b.balance
    }));
  } catch (e) {
    console.error("Failed to load balances:", e);
    return [];
  }
}

/**
 * Retrieve a quote for swapping `amountIn` of `sourceAsset` to `destAsset`.
 * Using Horizon's strict send pathfinding.
 */
export async function getSwapQuote(sourceAsset: Asset, amountIn: string, destAsset: Asset) {
  try {
    const response = await server.strictSendPaths(sourceAsset, amountIn, [destAsset]).call();
    if (response.records.length === 0) {
      throw new Error("No liquidity path found for this swap.");
    }
    // Return the best path (first one usually has best rate or shortest hops)
    return response.records[0];
  } catch (e: any) {
    throw new Error(e.message || "Failed to fetch swap quote");
  }
}

/**
 * Builds a swap transaction (PathPaymentStrictSend)
 */
export async function buildSwapTx(
  userPubKey: string, 
  sourceAsset: Asset, 
  destAsset: Asset, 
  amountIn: string, 
  minAmountOut: string,
  path: Asset[] = []
) {
  const account = await server.loadAccount(userPubKey);
  
  const tx = new TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.pathPaymentStrictSend({
      sendAsset: sourceAsset,
      sendAmount: amountIn,
      destination: userPubKey,
      destAsset: destAsset,
      destMin: minAmountOut,
      path: path
    }))
    .setTimeout(60)
    .build();

  return tx.toXDR();
}

export async function buildLiquidityPoolTx(
  pubKey: string,
  assetA: Asset,
  assetB: Asset,
  amountA: string, // maxAmountA (e.g. XLM to deposit)
  amountB: string  // maxAmountB (e.g. Token to deposit)
) {
  const account = await server.loadAccount(pubKey);
  const fee = await server.fetchBaseFee();

  const lpId = StellarSdk.getLiquidityPoolId("constant_product", {
    assetA,
    assetB,
    fee: StellarSdk.LiquidityPoolFeeV18
  }).toString("hex");

  const poolAsset = new StellarSdk.LiquidityPoolAsset(assetA, assetB, StellarSdk.LiquidityPoolFeeV18);

  const tx = new TransactionBuilder(account, { fee, networkPassphrase: Networks.TESTNET })
    .addOperation(
      Operation.changeTrust({
        asset: poolAsset
      })
    )
    .addOperation(
      Operation.liquidityPoolDeposit({
        liquidityPoolId: lpId,
        maxAmountA: amountA,
        maxAmountB: amountB,
        minPrice: "0.001",
        maxPrice: "100000" 
      })
    )
    .setTimeout(30)
    .build();

  return tx.toXDR();
}
