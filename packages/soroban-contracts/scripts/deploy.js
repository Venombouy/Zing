const { Keypair, Networks, TransactionBuilder, Operation, rpc: SorobanRpc, Asset, Contract, Address } = require('@stellar/stellar-sdk');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const rpc = new SorobanRpc.Server(SERVER_URL);

async function fundAccount(publicKey) {
  console.log(`Funding account: ${publicKey}`);
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    await res.json();
    console.log("Funded successfully!");
  } catch (e) {
    console.error("Funding failed:", e);
  }
}

async function submitTx(tx, keypair) {
  // Use prepareTransaction to simulate and attach footprint/resources
  let preparedTx = await rpc.prepareTransaction(tx);
  
  // Sign the transaction
  preparedTx.sign(keypair);
  
  console.log("Submitting transaction...");
  const sendResult = await rpc.sendTransaction(preparedTx);
  
  if (sendResult.errorResultXdr) {
    throw new Error(`Submit failed: ${sendResult.errorResultXdr}`);
  }

  // Poll for completion
  let statusResult;
  let attempts = 0;
  while (attempts < 40) {
    statusResult = await rpc.getTransaction(sendResult.hash);
    if (statusResult.status !== "NOT_FOUND") {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    attempts++;
  }

  if (statusResult.status !== "SUCCESS") {
    throw new Error(`Tx failed: ${JSON.stringify(statusResult)}`);
  }

  return statusResult;
}

async function deployContract(wasmName) {
  const deployer = Keypair.random();
  await fundAccount(deployer.publicKey());

  // Allow time for friendbot indexing
  await new Promise(resolve => setTimeout(resolve, 5000));

  const account = await rpc.getAccount(deployer.publicKey());
  
  const wasmPath = path.join(__dirname, '..', 'target', 'wasm32-unknown-unknown', 'release', wasmName);
  const wasmBuffer = fs.readFileSync(wasmPath);
  
  console.log(`Uploading ${wasmName}...`);
  // Upload Wasm
  const uploadTx = new TransactionBuilder(account, { fee: "100000", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.uploadContractWasm({ wasm: wasmBuffer }))
    .setTimeout(60)
    .build();

  const uploadRes = await submitTx(uploadTx, deployer);
  
  // Extract Wasm ID from result
  // The returnValue of uploadContractWasm is the Wasm ID bytes
  const wasmId = uploadRes.returnValue.value().toString('hex');
  console.log(`Wasm ID for ${wasmName}: ${wasmId}`);

  // Create Contract
  account.incrementSequenceNumber();
  const createTx = new TransactionBuilder(account, { fee: "2000000", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.createCustomContract({
      address: Address.fromString(deployer.publicKey()),
      wasmHash: Buffer.from(wasmId, 'hex')
    }))
    .setTimeout(120)
    .build();

  const createRes = await submitTx(createTx, deployer);
  
  // Extract Contract ID
  const contractId = createRes.returnValue.address().toString();
  console.log(`Deployed ${wasmName} at ID: ${contractId}`);
  
  return contractId;
}

async function main() {
  try {
    console.log("Starting deployments...");
    const campaignId = await deployContract('zing_campaign.wasm');
    const competitionId = await deployContract('zing_competition.wasm');
    const launchpadId = await deployContract('zing_launchpad.wasm');
    const smartWalletId = await deployContract('zing_smart_wallet.wasm');
    const predictionMarketId = await deployContract('zing_prediction_market.wasm');
    
    // Save to env
    const envContent = `\nNEXT_PUBLIC_CAMPAIGN_CONTRACT=${campaignId}\nNEXT_PUBLIC_COMPETITION_CONTRACT=${competitionId}\nNEXT_PUBLIC_LAUNCHPAD_CONTRACT=${launchpadId}\nNEXT_PUBLIC_SMART_WALLET_CONTRACT=${smartWalletId}\nNEXT_PUBLIC_PREDICTION_MARKET_CONTRACT=${predictionMarketId}\n`;
    fs.writeFileSync(path.join(__dirname, '..', '..', '..', '.env.local'), envContent, { flag: 'a' });
    console.log("Saved to .env.local successfully!");
  } catch(e) {
    console.error("Deployment failed:", e);
  }
}

main();
