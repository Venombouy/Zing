import type { Metadata } from "next";
import SettingsClient from "./client";

export const metadata: Metadata = {
  title: "Zing — Settings | Profile & Agent API",
  description: "Manage your Stellar account, profile, and Agent API keys.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
