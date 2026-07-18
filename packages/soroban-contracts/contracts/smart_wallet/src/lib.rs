#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec, BytesN};

#[contract]
pub struct SmartWallet;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Owner,
    RecoverySigner,
    DailyLimit,
}

#[contractimpl]
impl SmartWallet {
    pub fn init(env: Env, owner: Address) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Owner, &owner);
    }

    pub fn set_limit(env: Env, limit: u64) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();
        env.storage().instance().set(&DataKey::DailyLimit, &limit);
    }

    pub fn add_recovery(env: Env, recovery: Address) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();
        env.storage().instance().set(&DataKey::RecoverySigner, &recovery);
    }

    pub fn recover(env: Env, new_owner: Address) {
        let recovery: Address = env.storage().instance().get(&DataKey::RecoverySigner).unwrap();
        recovery.require_auth();
        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }
}
