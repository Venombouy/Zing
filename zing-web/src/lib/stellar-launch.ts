import { Keypair, Asset, TransactionBuilder, Operation, Networks } from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Creates a new random Issuer Keypair and funds it via Friendbot.
 */
export async function createAndFundIssuer() {
  const issuer = Keypair.random();
  console.log("Created new Issuer account:", issuer.publicKey());
  
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${issuer.publicKey()}`);
    if (!res.ok) throw new Error("Friendbot funding failed");
    return issuer;
  } catch (e) {
    console.error("Funding error:", e);
    throw new Error("Failed to fund issuer account. Testnet may be congested.");
  }
}

/**
 * Builds the transaction for the distributor (user wallet) to trust the new asset.
 */
export async function buildTrustlineTx(distributorPubKey: string, assetCode: string, issuerPubKey: string) {
  const distributor = await server.loadAccount(distributorPubKey);
  const asset = new Asset(assetCode, issuerPubKey);

  const tx = new TransactionBuilder(distributor, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(60)
    .build();

  return tx.toXDR();
}

/**
 * Submits a signed XDR transaction to Horizon.
 */
export async function submitTx(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await server.submitTransaction(tx);
  return response;
}

/**
 * Builds and signs (with Issuer key) the transaction to mint the supply and lock the issuer account.
 */
export async function buildAndSignMintTx(issuer: Keypair, distributorPubKey: string, assetCode: string, amount: string) {
  const issuerAccount = await server.loadAccount(issuer.publicKey());
  const asset = new Asset(assetCode, issuer.publicKey());

  const tx = new TransactionBuilder(issuerAccount, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.payment({
      destination: distributorPubKey,
      asset,
      amount: amount
    }))
    .addOperation(Operation.setOptions({
      masterWeight: 0,
      lowThreshold: 0,
      medThreshold: 0,
      highThreshold: 0
    }))
    .setTimeout(60)
    .build();

  tx.sign(issuer);
  return tx.toXDR();
}
