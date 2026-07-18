/**
 * Social Booster — server component.
 * Fetches campaigns + events from Supabase.
 * Justified: Zing Doc §8 — Social Booster / MindShare equivalent.
 */

import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import SocialBoosterClient from "./client";

export const metadata: Metadata = {
  title: "Zing — Social Booster | Campaign Engine",
  description:
    "Create KOL and community campaigns with Stellar-settled reward pools. AI-scored contributions, transparent leaderboards.",
};

export default async function SocialBoosterPage() {
  const { data: rawCampaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select(`
      id,
      project_id,
      reward_pool_amount,
      rules,
      quests,
      scoring_weights,
      payout_logic,
      fee_model,
      created_at,
      projects ( name, symbol )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  // Supabase returns the join as an array — normalize to single object or null
  const campaigns = (rawCampaigns ?? []).map((c) => ({
    ...c,
    projects: Array.isArray(c.projects) ? (c.projects[0] ?? null) : c.projects,
  }));

  // Campaign event counts per campaign
  const { data: eventCounts } = await supabase
    .from("campaign_events")
    .select("campaign_id, status");

  return (
    <SocialBoosterClient
      campaigns={campaigns}
      eventCounts={eventCounts ?? []}
      dbError={campaignError?.message ?? null}
    />
  );
}
