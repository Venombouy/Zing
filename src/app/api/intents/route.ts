import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Agent API: POST /api/intents
 * Zing Doc: Allows AI agents or external clients to submit structured intent requests.
 */

// JSON Schema Definitions for strict validation
const intentSchemas = {
  swap: {
    type: "object",
    required: ["source_asset", "destination_asset", "amount", "user_id"],
    properties: {
      source_asset: { type: "string" },
      destination_asset: { type: "string" },
      amount: { type: "number" },
      user_id: { type: "string" },
      max_slippage_bps: { type: "number" },
    },
  },
  deposit: {
    type: "object",
    required: ["source_asset", "amount", "user_id", "source_chain"],
    properties: {
      source_asset: { type: "string" },
      amount: { type: "number" },
      user_id: { type: "string" },
      source_chain: { type: "string" },
    },
  },
  campaign_funding: {
    type: "object",
    required: ["campaign_id", "amount", "user_id"],
    properties: {
      campaign_id: { type: "string" },
      amount: { type: "number" },
      user_id: { type: "string" },
    },
  },
};

function validatePayload(type: keyof typeof intentSchemas, payload: any): string[] {
  const schema = intentSchemas[type];
  const errors: string[] = [];

  if (!schema) {
    return ["Invalid intent type"];
  }

  for (const req of schema.required) {
    if (payload[req] === undefined || payload[req] === null) {
      errors.push(`Missing required field: ${req}`);
    }
  }

  // Type checking (basic)
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    if (payload[key] !== undefined) {
      if (typeof payload[key] !== propSchema.type) {
        errors.push(`Invalid type for ${key}: expected ${propSchema.type}, got ${typeof payload[key]}`);
      }
    }
  }

  return errors;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    if (!type || !payload) {
      return NextResponse.json(
        { error: "Missing 'type' or 'payload' in request body" },
        { status: 400 }
      );
    }

    const validationErrors = validatePayload(type as any, payload);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Insert into Supabase
    // Using placeholder status 'pending_submission'
    const insertData: any = {
      type,
      user_id: payload.user_id,
      status: "pending_submission",
    };

    if (type === "swap") {
      insertData.source_asset = payload.source_asset;
      insertData.destination_asset = payload.destination_asset;
      insertData.amount = payload.amount;
    } else if (type === "deposit") {
      insertData.source_asset = payload.source_asset;
      insertData.amount = payload.amount;
    } else if (type === "campaign_funding") {
      insertData.amount = payload.amount;
    }

    const { data, error } = await supabase
      .from("intents")
      .insert(insertData)
      .select("id, status, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Intent submitted successfully",
      intent: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid JSON or server error", details: err?.message },
      { status: 500 }
    );
  }
}
