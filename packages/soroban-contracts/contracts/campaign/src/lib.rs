#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol};

#[contracttype]
pub enum DataKey {
    Admin,
    TotalRewardPool,
}

#[contract]
pub struct CampaignContract;

#[contractimpl]
impl CampaignContract {
    pub fn initialize(env: Env, admin: Address, initial_pool: i128) {
        assert!(!env.storage().instance().has(&DataKey::Admin), "already initialized");
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalRewardPool, &initial_pool);
    }

    pub fn distribute_reward(env: Env, user: Address, amount: i128) {
        // Admin must authorize the distribution
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut pool: i128 = env.storage().instance().get(&DataKey::TotalRewardPool).unwrap();
        assert!(pool >= amount, "insufficient reward pool");

        pool -= amount;
        env.storage().instance().set(&DataKey::TotalRewardPool, &pool);

        // In a real implementation, this would call the token contract to transfer the asset
        // token::Client::new(&env, &token_id).transfer(&env.current_contract_address(), &user, &amount);
        
        // Emitting an event instead for now
        env.events().publish((Symbol::new(&env, "reward_paid"), user), amount);
    }
}
