#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

#[contracttype]
pub enum DataKey {
    Admin,
    TokensCreated,
}

#[contracttype]
pub struct TokenMeta {
    pub creator: Address,
    pub name: String,
    pub symbol: String,
    pub total_supply: i128,
}

#[contract]
pub struct LaunchpadContract;

#[contractimpl]
impl LaunchpadContract {
    pub fn initialize(env: Env, admin: Address) {
        assert!(!env.storage().instance().has(&DataKey::Admin), "already initialized");
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokensCreated, &0u32);
    }

    pub fn launch_token(
        env: Env,
        creator: Address,
        name: String,
        symbol: String,
        total_supply: i128,
    ) -> u32 {
        creator.require_auth();

        let mut count: u32 = env.storage().instance().get(&DataKey::TokensCreated).unwrap_or(0);
        count += 1;

        let meta = TokenMeta {
            creator: creator.clone(),
            name,
            symbol: symbol.clone(),
            total_supply,
        };

        // In a full implementation, this would deploy a SAC or custom token contract
        // using deployer and initialize it. For now, we store metadata.
        env.storage().persistent().set(&symbol, &meta);
        env.storage().instance().set(&DataKey::TokensCreated, &count);

        count
    }

    pub fn get_token_meta(env: Env, symbol: String) -> Option<TokenMeta> {
        env.storage().persistent().get(&symbol)
    }
}
