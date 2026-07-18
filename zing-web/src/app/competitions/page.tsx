/**
 * Competitions — server component.
 * Fetches competitions + entries from Supabase.
 * Justified: Zing Doc §9 — Trading Competitions.
 */

import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import CompetitionsClient from "./client";

export const metadata: Metadata = {
  title: "Zing — Trading Competitions | Skill-Based Contests",
  description:
    "Transparent, on-chain trading competitions on Stellar DEX. Reward skilled trading — not volume or luck.",
};

export default async function CompetitionsPage() {
  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("id, asset_tracked, time_window_start, time_window_end, reward_tiers, scoring_weights, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  // Get entry counts + top scores per competition
  const { data: entries } = await supabase
    .from("competition_entries")
    .select("competition_id, user_id, score, rank, reward_distribution")
    .order("rank", { ascending: true })
    .limit(200);

  return (
    <CompetitionsClient
      competitions={competitions ?? []}
      entries={entries ?? []}
      dbError={error?.message ?? null}
    />
  );
}
