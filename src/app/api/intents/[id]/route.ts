import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Agent API: GET /api/intents/:id
 * Zing Doc: Allows AI agents or external clients to poll the status of a previously submitted intent.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: intentId } = await params;

  if (!intentId) {
    return NextResponse.json({ error: "Missing intent ID" }, { status: 400 });
  }

  // Fetch from Supabase intents table
  const { data, error } = await supabase
    .from("intents")
    .select("id, type, status, user_id, source_asset, destination_asset, amount, created_at")
    .eq("id", intentId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Intent not found", details: error?.message },
      { status: 404 }
    );
  }

  return NextResponse.json({ intent: data });
}
