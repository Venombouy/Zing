import postgres from 'postgres';

const sql = postgres('postgresql://postgres:1912Divyanshu@@db.zdkkvjfmmcfggljbwyui.supabase.co:5432/postgres', {
  ssl: 'require',
});

async function run() {
  try {
    console.log("Connecting to Supabase...");
    
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stellar_pubkey TEXT UNIQUE NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("Created users");

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id),
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        total_supply NUMERIC,
        category TEXT,
        deployment_type TEXT,
        status TEXT DEFAULT 'pending_deployment',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("Created projects");

    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        reward_pool_amount NUMERIC NOT NULL,
        rules JSONB,
        quests JSONB,
        scoring_weights JSONB,
        payout_logic JSONB,
        fee_model JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("Created campaigns");

    await sql`
      CREATE TABLE IF NOT EXISTS campaign_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES campaigns(id),
        user_id UUID REFERENCES users(id),
        event_type TEXT,
        event_data JSONB,
        status TEXT DEFAULT 'submitted',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("Created campaign_events");

    await sql`
      CREATE TABLE IF NOT EXISTS competitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_tracked TEXT NOT NULL,
        time_window_start TIMESTAMPTZ,
        time_window_end TIMESTAMPTZ,
        reward_tiers JSONB,
        scoring_weights JSONB,
        status TEXT DEFAULT 'upcoming',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("Created competitions");

    await sql`
      CREATE TABLE IF NOT EXISTS competition_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        competition_id UUID REFERENCES competitions(id),
        user_id UUID REFERENCES users(id),
        score NUMERIC DEFAULT 0,
        rank INTEGER,
        reward_distribution NUMERIC,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("Created competition_entries");

    await sql`
      CREATE TABLE IF NOT EXISTS intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        type TEXT NOT NULL,
        source_asset TEXT,
        destination_asset TEXT,
        amount NUMERIC,
        status TEXT DEFAULT 'pending_submission',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("Created intents");

    console.log("All tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    await sql.end();
  }
}

run();
