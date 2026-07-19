#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, String, Symbol
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Token,
    Question,
    EndTime,
    Resolved,
    Outcome, // true for YES, false for NO
    TotalYes,
    TotalNo,
    YesBet(Address),
    NoBet(Address),
}

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        question: String,
        end_time: u64,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Question, &question);
        env.storage().instance().set(&DataKey::EndTime, &end_time);
        env.storage().instance().set(&DataKey::Resolved, &false);
        env.storage().instance().set(&DataKey::TotalYes, &0_i128);
        env.storage().instance().set(&DataKey::TotalNo, &0_i128);
    }

    pub fn bet(env: Env, user: Address, is_yes: bool, amount: i128) {
        user.require_auth();
        
        let resolved: bool = env.storage().instance().get(&DataKey::Resolved).unwrap();
        if resolved {
            panic!("Market already resolved");
        }
        
        let end_time: u64 = env.storage().instance().get(&DataKey::EndTime).unwrap();
        if env.ledger().timestamp() >= end_time {
            panic!("Market closed for betting");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        if is_yes {
            let mut total_yes: i128 = env.storage().instance().get(&DataKey::TotalYes).unwrap();
            total_yes += amount;
            env.storage().instance().set(&DataKey::TotalYes, &total_yes);

            let key = DataKey::YesBet(user.clone());
            let mut bet: i128 = env.storage().persistent().get(&key).unwrap_or(0);
            bet += amount;
            env.storage().persistent().set(&key, &bet);
        } else {
            let mut total_no: i128 = env.storage().instance().get(&DataKey::TotalNo).unwrap();
            total_no += amount;
            env.storage().instance().set(&DataKey::TotalNo, &total_no);

            let key = DataKey::NoBet(user.clone());
            let mut bet: i128 = env.storage().persistent().get(&key).unwrap_or(0);
            bet += amount;
            env.storage().persistent().set(&key, &bet);
        }
    }

    pub fn resolve(env: Env, outcome: bool) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let resolved: bool = env.storage().instance().get(&DataKey::Resolved).unwrap();
        if resolved {
            panic!("Already resolved");
        }

        env.storage().instance().set(&DataKey::Resolved, &true);
        env.storage().instance().set(&DataKey::Outcome, &outcome);
    }

    pub fn claim(env: Env, user: Address) {
        let resolved: bool = env.storage().instance().get(&DataKey::Resolved).unwrap();
        if !resolved {
            panic!("Market not resolved yet");
        }

        let outcome: bool = env.storage().instance().get(&DataKey::Outcome).unwrap();
        let total_yes: i128 = env.storage().instance().get(&DataKey::TotalYes).unwrap();
        let total_no: i128 = env.storage().instance().get(&DataKey::TotalNo).unwrap();
        let total_pool = total_yes + total_no;

        let yes_key = DataKey::YesBet(user.clone());
        let no_key = DataKey::NoBet(user.clone());

        let yes_bet: i128 = env.storage().persistent().get(&yes_key).unwrap_or(0);
        let no_bet: i128 = env.storage().persistent().get(&no_key).unwrap_or(0);

        let mut reward: i128 = 0;

        if outcome {
            if yes_bet > 0 {
                // User won on YES
                // reward = yes_bet + (yes_bet / total_yes) * total_no
                reward = yes_bet + (yes_bet * total_no) / total_yes;
                env.storage().persistent().set(&yes_key, &0_i128); // prevent double claim
            }
        } else {
            if no_bet > 0 {
                // User won on NO
                reward = no_bet + (no_bet * total_yes) / total_no;
                env.storage().persistent().set(&no_key, &0_i128);
            }
        }

        if reward > 0 {
            let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
            let token_client = token::Client::new(&env, &token_addr);
            token_client.transfer(&env.current_contract_address(), &user, &reward);
        }
    }
}
