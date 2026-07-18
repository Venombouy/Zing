-- Migration: init.sql

-- 1. users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. stellar_accounts
-- Justified in Zing Doc 10.2: user and muxed accounts, wallet abstraction
CREATE TABLE stellar_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    public_key VARCHAR(56) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- 'user' or 'muxed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. projects
-- Justified in Zing Doc 7.3: name, symbol, supply, metadata, category, deployment type
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    supply NUMERIC NOT NULL,
    metadata JSONB,
    category VARCHAR(50),
    deployment_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. campaigns
-- Justified in Zing Doc 8.2: reward pool, rules, quests, scoring weights, payout logic, budget & fee model
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    reward_pool_amount NUMERIC NOT NULL,
    rules JSONB NOT NULL,
    quests JSONB NOT NULL,
    scoring_weights JSONB NOT NULL,
    payout_logic JSONB NOT NULL,
    fee_model JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. campaign_events
-- Justified in Zing Doc 8.3: participants submit evidence, approved contributions
CREATE TABLE campaign_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    user_id UUID REFERENCES users(id),
    evidence JSONB NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g. 'submitted', 'approved', 'rejected'
    ai_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. competitions
-- Justified in Zing Doc 9.2: asset(s) tracked, time window, reward tiers, scoring weights
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tracked VARCHAR(255) NOT NULL,
    time_window_start TIMESTAMPTZ NOT NULL,
    time_window_end TIMESTAMPTZ NOT NULL,
    reward_tiers JSONB NOT NULL,
    scoring_weights JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. competition_entries
-- Justified in Zing Doc 9.2: ranked leaderboard, reward distributions, trade data
CREATE TABLE competition_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES competitions(id),
    user_id UUID REFERENCES users(id),
    score NUMERIC NOT NULL,
    rank INTEGER,
    reward_distribution NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. trades_cache
-- Justified in Zing Doc 6.2: last trades, maker counts, buy/sell splits, trade history
CREATE TABLE trades_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair VARCHAR(100) NOT NULL,
    maker VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
    amount_token NUMERIC NOT NULL,
    amount_quote NUMERIC NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. intents
-- Justified in Zing Doc 10.3: user/agent actions ("Swap asset A -> asset B", "Deposit into vault", "Fund campaign")
CREATE TABLE intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    details JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. audit_logs
-- Justified in Zing Doc 2.2: "Every action is traceable on-chain and in dashboards"
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(255) NOT NULL,
    details JSONB NOT NULL,
    trace_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICY SKELETONS

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_policy" ON users FOR SELECT USING (true); -- TODO: Final logic
CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (true); -- TODO: Final logic
CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (true); -- TODO: Final logic

ALTER TABLE stellar_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stellar_accounts_policy" ON stellar_accounts FOR ALL USING (true); -- TODO: Final logic

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_policy" ON projects FOR ALL USING (true); -- TODO: Final logic

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_policy" ON campaigns FOR ALL USING (true); -- TODO: Final logic

ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_events_policy" ON campaign_events FOR ALL USING (true); -- TODO: Final logic

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitions_policy" ON competitions FOR ALL USING (true); -- TODO: Final logic

ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competition_entries_policy" ON competition_entries FOR ALL USING (true); -- TODO: Final logic

ALTER TABLE trades_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trades_cache_policy" ON trades_cache FOR ALL USING (true); -- TODO: Final logic

ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intents_policy" ON intents FOR ALL USING (true); -- TODO: Final logic

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_policy" ON audit_logs FOR ALL USING (true); -- TODO: Final logic
