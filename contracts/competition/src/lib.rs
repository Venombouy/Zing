#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

#[contracttype]
pub enum DataKey {
    Admin,
    Score(Address),
    IsActive,
}

#[contract]
pub struct CompetitionContract;

#[contractimpl]
impl CompetitionContract {
    pub fn initialize(env: Env, admin: Address) {
        assert!(!env.storage().instance().has(&DataKey::Admin), "already initialized");
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::IsActive, &true);
    }

    pub fn update_score(env: Env, user: Address, score: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let is_active: bool = env.storage().instance().get(&DataKey::IsActive).unwrap_or(false);
        assert!(is_active, "competition is closed");

        env.storage().persistent().set(&DataKey::Score(user.clone()), &score);
        env.events().publish((Symbol::new(&env, "score_updated"), user), score);
    }

    pub fn end_competition(env: Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::IsActive, &false);
    }

    pub fn get_score(env: Env, user: Address) -> Option<i128> {
        env.storage().persistent().get(&DataKey::Score(user))
    }
}
