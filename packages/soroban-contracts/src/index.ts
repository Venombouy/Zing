/**
 * Zing — @zing/soroban-contracts
 *
 * TypeScript interfaces for Zing Soroban smart contracts.
 *
 * DEPLOYMENT STATUS: NOT YET DEPLOYED
 * All contracts are interface definitions only. No real contract ID exists.
 * Functions marked PENDING_SOROBAN_DEPLOYMENT will throw if called.
 *
 * Source doc mappings:
 *   LaunchpadContract  → Zing Doc §7 (LaunchPad)
 *   CampaignContract   → Zing Doc §8 (Social Booster)
 *   CompetitionContract→ Zing Doc §9 (Trading Competitions)
 */

// ─── Shared Types ───────────────────────────────────────────────────────────────

/**
 * Represents a Stellar asset reference as used in Soroban contracts.
 * Justified by: Zing Doc §7.2 — Stellar Asset Launch, Soroban Token Launch,
 * Agent Tokenization; §8.1 — reward pools in USDC/XLM or other supported asset.
 */
export interface SorobanAssetRef {
  /** 'native' for XLM, 'issued' for any other Stellar asset */
  assetType: "native" | "issued";
  /** Asset code, e.g. "USDC". Undefined for native XLM. */
  assetCode?: string;
  /** G… issuer address. Undefined for native XLM. */
  assetIssuer?: string;
}

/**
 * Represents the result of a Soroban transaction invocation.
 * In production this wraps a Soroban transaction envelope XDR + simulation result.
 * For now it surfaces the pending status.
 */
export interface SorobanInvokeResult {
  status: "PENDING_SOROBAN_DEPLOYMENT" | "success" | "error";
  xdr?: string;
  error?: string;
}

// ─── LaunchpadContract ──────────────────────────────────────────────────────────

/**
 * Parameters for creating a new asset/token on the Launchpad.
 * Justified by: Zing Doc §7.3 — Define Asset step:
 *   "name, symbol, supply, metadata, category (meme, AI, DeFi, RWA, etc.)"
 */
export interface LaunchpadCreateAssetParams {
  name: string;
  symbol: string;
  /** Total supply as a string to avoid JS number precision issues */
  supply: string;
  /** Arbitrary metadata (description, logo URI, website, social links) */
  metadata: Record<string, string>;
  /** Zing Doc §7.3: category choices */
  category: "meme" | "AI" | "DeFi" | "RWA" | "gaming" | "other";
  /** Zing Doc §7.2: deployment type */
  deploymentType: "stellar-only" | "stellar-plus-evm" | "stellar-plus-solana";
}

/**
 * Parameters for configuring initial liquidity after asset creation.
 * Justified by: Zing Doc §7.3 — Configure Liquidity step:
 *   "initial pools on Stellar DEX, optional cross-chain pools via intents and Axelar"
 */
export interface LaunchpadLiquidityConfig {
  /** Initial XLM or USDC amount to seed the Stellar DEX pool */
  initialPoolAmountXLM?: string;
  initialPoolAmountUSDC?: string;
  /**
   * Whether to configure cross-chain pools.
   * Zing Doc §7.2: "optional cross-chain pools via intents and Axelar"
   * Implementation: PENDING Phase 5 (interop modules).
   */
  enableCrossChainPools: boolean;
}

/**
 * Interface for the Zing Launchpad Soroban contract.
 *
 * Contract functions are based ONLY on behavior described in Zing Doc §7:
 *   - createAsset  → §7.3 step 1 "Define Asset" + step 4 "Execute Launch"
 *   - configureLiquidity → §7.3 step 3 "Configure Liquidity"
 *
 * DEPLOYMENT STATUS: NOT YET DEPLOYED
 * No contract ID exists. All execute methods return PENDING_SOROBAN_DEPLOYMENT.
 */
export interface LaunchpadContract {
  /**
   * Justification: Zing Doc §7.3 — "Soroban contracts mint and configure pools;
   * listing and dashboard entries created."
   *
   * In production, this builds and returns a Soroban InvokeHostFunction XDR
   * for client-side signing. For now returns pending status.
   *
   * @param signerPublicKey  G… public key of the project founder (signing happens client-side)
   * @param params           Asset definition parameters
   */
  createAsset(
    signerPublicKey: string,
    params: LaunchpadCreateAssetParams
  ): Promise<SorobanInvokeResult>;

  /**
   * Justification: Zing Doc §7.3 — "Configure Liquidity: initial pools on Stellar DEX"
   *
   * @param signerPublicKey  G… public key of the project founder
   * @param assetCode        Code of the newly launched asset
   * @param assetIssuer      G… issuer of the newly launched asset
   * @param config           Liquidity configuration
   */
  configureLiquidity(
    signerPublicKey: string,
    assetCode: string,
    assetIssuer: string,
    config: LaunchpadLiquidityConfig
  ): Promise<SorobanInvokeResult>;
}

// ─── CampaignContract ───────────────────────────────────────────────────────────

/**
 * A single quest definition within a campaign.
 * Justified by: Zing Doc §8.2 — "Quests: on-chain representation of social actions
 * (follow, post, join group), tied to off-chain verification."
 */
export interface CampaignQuest {
  questType: "follow" | "post" | "join_group";
  targetUrl: string;
  /** Reward per completion, in the campaign's reward asset */
  rewardPerCompletion: string;
}

/**
 * Parameters for creating a Social Booster campaign.
 * Justified by: Zing Doc §8.2 — "Campaign Contract stores reward pool,
 * rules, quests, scoring weights, and payout logic."
 */
export interface CampaignCreateParams {
  /** Zing Doc §8.3: "deposits reward pool (USDC/XLM or other supported asset)" */
  rewardPoolAmount: string;
  rewardPoolAsset: SorobanAssetRef;
  /**
   * Rules are a flexible key-value store for campaign configuration.
   * Zing Doc §8.2: "rules" — exact format not specified in doc; OPEN QUESTION.
   */
  rules: Record<string, string | number>;
  /** Zing Doc §8.2: quests */
  quests: CampaignQuest[];
  /**
   * Zing Doc §8.2: "scoring weights"
   * Exact field names not defined in doc — OPEN QUESTION.
   */
  scoringWeights: Record<string, number>;
  /**
   * Zing Doc §8.2: "payout logic" and "Budget & Fee Model:
   * configurable fee (e.g., platform fee on reward pool) and dynamic payout curves."
   * Exact curve formula not specified in doc — OPEN QUESTION.
   */
  platformFeePercent: number;
}

/**
 * Records an approved contribution/evidence submission.
 * Justified by: Zing Doc §8.3 — "Campaign contract records approved contributions
 * and computes rewards."
 */
export interface CampaignContribution {
  participantPublicKey: string;
  evidenceUrl: string;
  /** AI score (0–100) from off-chain scoring pipeline. Zing Doc §8.3 */
  aiScore: number;
}

/**
 * Interface for the Zing Social Booster (Campaign) Soroban contract.
 *
 * Functions based ONLY on behavior described in Zing Doc §8:
 *   - createCampaign       → §8.3 step 1 "Project creates campaign; deposits reward pool"
 *   - recordContribution   → §8.3 step 3 "Campaign contract records approved contributions"
 *   - distributeRewards    → §8.3 step 4 "Soroban contract pays rewards on Stellar"
 *
 * DEPLOYMENT STATUS: NOT YET DEPLOYED
 */
export interface CampaignContract {
  /**
   * Justification: Zing Doc §8.3 — "Project creates campaign; deposits reward pool
   * (USDC/XLM or other supported asset)."
   *
   * @param signerPublicKey  G… public key of the project creating the campaign
   * @param params           Campaign configuration
   */
  createCampaign(
    signerPublicKey: string,
    params: CampaignCreateParams
  ): Promise<SorobanInvokeResult>;

  /**
   * Justification: Zing Doc §8.3 — "Campaign contract records approved contributions
   * and computes rewards."
   *
   * @param campaignContractId  On-chain campaign identifier (Soroban contract ID)
   * @param contribution        Verified contribution from AI scoring pipeline
   */
  recordContribution(
    campaignContractId: string,
    contribution: CampaignContribution
  ): Promise<SorobanInvokeResult>;

  /**
   * Justification: Zing Doc §8.3 — "Soroban contract pays rewards on Stellar;
   * optional cross-chain transfers via CCTP/Axelar."
   *
   * @param campaignContractId  On-chain campaign identifier
   * @param signerPublicKey     G… public key of the authorized caller (project or platform)
   */
  distributeRewards(
    campaignContractId: string,
    signerPublicKey: string
  ): Promise<SorobanInvokeResult>;
}

// ─── CompetitionContract ────────────────────────────────────────────────────────

/**
 * A single reward tier definition.
 * Justified by: Zing Doc §9.2 — "Parameters: asset(s) tracked, time window,
 * reward tiers, scoring weights."
 */
export interface CompetitionRewardTier {
  /** e.g. "gold", "silver", "bronze" — from AIDA doc §5.8.2 */
  tierName: string;
  /** Percentage of the total pool allocated to this tier (must sum to 100) */
  allocationPercent: number;
}

/**
 * Parameters for creating a trading competition.
 * Justified by: Zing Doc §9.2 — "Competition Contract: parameters: asset(s) tracked,
 * time window, reward tiers, scoring weights."
 */
export interface CompetitionCreateParams {
  /** Zing Doc §9.2 — "asset(s) tracked" */
  trackedAssets: SorobanAssetRef[];
  /** Zing Doc §9.2 — "time window" */
  startTime: number; // Unix timestamp
  endTime: number;   // Unix timestamp
  /** Zing Doc §9.2 — "reward tiers" */
  rewardTiers: CompetitionRewardTier[];
  /**
   * Zing Doc §9.2 — "scoring weights"
   * Zing Doc §9.3 signals: liquidity quality, trade timing, risk-adjusted return,
   * contribution to price discovery. Exact formula: OPEN QUESTION.
   */
  scoringWeights: {
    liquidityQuality?: number;
    tradeTiming?: number;
    riskAdjustedReturn?: number;
    priceDiscoveryContribution?: number;
  };
  rewardPoolAmount: string;
  rewardPoolAsset: SorobanAssetRef;
}

/**
 * Represents a scored entry in a competition.
 * Justified by: Zing Doc §9.2 — "Outputs: ranked leaderboard, reward distributions."
 */
export interface CompetitionEntry {
  participantPublicKey: string;
  score: number;
  rank?: number;
  rewardAmount?: string;
}

/**
 * Interface for the Zing Trading Competition Soroban contract.
 *
 * Functions based ONLY on behavior described in Zing Doc §9:
 *   - createCompetition   → §9.2 "Competition Contract" (setup)
 *   - submitScore         → §9.2 "Inputs: trade data from Zing Terminal's feed"
 *   - finalizeLeaderboard → §9.2 "Outputs: ranked leaderboard, reward distributions"
 *
 * DEPLOYMENT STATUS: NOT YET DEPLOYED
 */
export interface CompetitionContract {
  /**
   * Justification: Zing Doc §9.2 — "Parameters: asset(s) tracked, time window,
   * reward tiers, scoring weights."
   *
   * @param signerPublicKey  G… public key of the project/platform creating the competition
   * @param params           Competition configuration
   */
  createCompetition(
    signerPublicKey: string,
    params: CompetitionCreateParams
  ): Promise<SorobanInvokeResult>;

  /**
   * Justification: Zing Doc §9.2 — "Inputs: trade data from Zing Terminal's feed
   * and on-chain logs."
   * Zing Doc §9.3 — "Zing competition contracts derive signals from Stellar DEX
   * and cross-chain swaps (via intents)."
   *
   * @param competitionContractId  On-chain competition identifier
   * @param entry                  Scored entry derived from DEX trade feed
   */
  submitScore(
    competitionContractId: string,
    entry: CompetitionEntry
  ): Promise<SorobanInvokeResult>;

  /**
   * Justification: Zing Doc §9.2 — "Outputs: ranked leaderboard, reward distributions."
   *
   * @param competitionContractId  On-chain competition identifier
   * @param signerPublicKey        G… public key of the authorized finalizer
   */
  finalizeLeaderboard(
    competitionContractId: string,
    signerPublicKey: string
  ): Promise<SorobanInvokeResult & { entries: CompetitionEntry[] }>;
}

// ─── Pending Stub Implementations ──────────────────────────────────────────────

const PENDING: SorobanInvokeResult = {
  status: "PENDING_SOROBAN_DEPLOYMENT",
};

/**
 * Stub implementation of LaunchpadContract.
 * All methods return PENDING_SOROBAN_DEPLOYMENT.
 * Replace with real Soroban client bindings once contracts are deployed.
 *
 * PENDING: Launchpad contract deployment — no contract ID exists.
 */
export const launchpadContractStub: LaunchpadContract = {
  async createAsset(_signerPublicKey, _params) {
    return PENDING;
  },
  async configureLiquidity(_signerPublicKey, _assetCode, _assetIssuer, _config) {
    return PENDING;
  },
};

/**
 * Stub implementation of CampaignContract.
 * All methods return PENDING_SOROBAN_DEPLOYMENT.
 *
 * PENDING: Campaign contract deployment — no contract ID exists.
 */
export const campaignContractStub: CampaignContract = {
  async createCampaign(_signerPublicKey, _params) {
    return PENDING;
  },
  async recordContribution(_campaignContractId, _contribution) {
    return PENDING;
  },
  async distributeRewards(_campaignContractId, _signerPublicKey) {
    return PENDING;
  },
};

/**
 * Stub implementation of CompetitionContract.
 * All methods return PENDING_SOROBAN_DEPLOYMENT.
 *
 * PENDING: Competition contract deployment — no contract ID exists.
 */
export const competitionContractStub: CompetitionContract = {
  async createCompetition(_signerPublicKey, _params) {
    return PENDING;
  },
  async submitScore(_competitionContractId, _entry) {
    return PENDING;
  },
  async finalizeLeaderboard(_competitionContractId, _signerPublicKey) {
    return { ...PENDING, entries: [] };
  },
};
