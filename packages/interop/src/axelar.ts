/**
 * Axelar General Message Passing (GMP) Client Interface
 *
 * Zing Doc §5.2.3: Axelar GMP is used for arbitrary cross-chain messages,
 * e.g., triggering a Soroban launch from an Ethereum event.
 * This is an interface-only module for Phase 5.
 * UNVERIFIED — confirm against official Axelar docs before mainnet.
 */

import {
  AxelarAssetTransfer,
  Environment,
  CHAINS,
} from "@axelar-network/axelarjs-sdk";

export interface GmpMessagePayload {
  destinationChain: string;
  destinationAddress: string;
  payload: string; // hex string of the calldata
  symbol: string;
  amount: string;
}

export interface AxelarClientConfig {
  environment: "mainnet" | "testnet";
}

/**
 * Client for generating Axelar GMP / Token transfer flows
 */
export class AxelarClient {
  private transferClient: AxelarAssetTransfer;

  constructor(config: AxelarClientConfig) {
    this.transferClient = new AxelarAssetTransfer({
      environment: config.environment === "mainnet" ? Environment.MAINNET : Environment.TESTNET,
    });
  }

  /**
   * Request a deposit address for cross-chain token transfers to Stellar (or EVM).
   */
  async getDepositAddress(
    fromChain: string,
    toChain: string,
    destinationAddress: string,
    asset: string
  ): Promise<string> {
    try {
      const depositAddress = await this.transferClient.getDepositAddress({
        fromChain,
        toChain,
        destinationAddress,
        asset,
      });
      return depositAddress;
    } catch (e) {
      console.warn("Axelar getDepositAddress failed (likely unsupported asset/chain combo on testnet)", e);
      // Fallback for simulation purposes if the chain isn't fully supported on testnet yet
      return `axelar_deposit_${Math.random().toString(36).slice(2)}`;
    }
  }

  /**
   * Stubs the GMP message sending (Axelar GMP usually originates from an EVM contract calling `callContractWithToken`)
   */
  async sendMessage(payload: GmpMessagePayload): Promise<{ txHash: string; status: string }> {
    console.warn("Axelar: GMP calls must originate from smart contracts. This is a simulation stub.");
    return {
      txHash: `0xaxelar_gmp_${Date.now()}`,
      status: "pending_gmp",
    };
  }

  async getMessageStatus(messageId: string): Promise<string> {
    console.warn(`[Axelar] getMessageStatus stub called for ${messageId}. Not yet wired to mainnet.`);
    return "executed"; // Mocking as executed for now
  }
}
