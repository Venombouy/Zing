import { Keypair, Asset, TransactionBuilder, Operation, Networks } from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc } from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

const SOROBAN_URL = "https://soroban-testnet.stellar.org";
const sorobanServer = new rpc.Server(SOROBAN_URL);

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
 * Submits a signed XDR transaction to Soroban RPC and polls for completion.
 */
export async function submitTx(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await sorobanServer.sendTransaction(tx);
  if (response.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${JSON.stringify(response.errorResult)}`);
  }
  
  let statusResponse = await sorobanServer.getTransaction(response.hash);
  while (statusResponse.status === "NOT_FOUND" || statusResponse.status === "PENDING") {
    await new Promise(resolve => setTimeout(resolve, 2000));
    statusResponse = await sorobanServer.getTransaction(response.hash);
  }
  
  if (statusResponse.status === "FAILED") {
    throw new Error(`Transaction failed on-chain. Please check inputs or contract logic.`);
  }
  
  return { ...statusResponse, hash: response.hash };
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

/**
 * Builds a Soroban transaction to invoke the launchpad contract.
 */
export async function buildSorobanLaunchTx(
  userPubKey: string,
  name: string,
  symbol: string,
  totalSupply: string
) {
  const account = await server.loadAccount(userPubKey);
  const contractId = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT;
  if (!contractId) throw new Error("Missing NEXT_PUBLIC_LAUNCHPAD_CONTRACT in .env.local");

  const contract = new StellarSdk.Contract(contractId);
  
  const creatorScVal = new StellarSdk.Address(userPubKey).toScVal();
  const nameScVal = StellarSdk.xdr.ScVal.scvString(name);
  const symbolScVal = StellarSdk.xdr.ScVal.scvString(symbol);
  const supplyScVal = StellarSdk.nativeToScVal(BigInt(totalSupply), { type: "i128" });

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(contract.call("launch_token", creatorScVal, nameScVal, symbolScVal, supplyScVal))
    .setTimeout(60)
    .build();

  const preparedTx = await sorobanServer.prepareTransaction(tx);
  return preparedTx.toXDR();
}
