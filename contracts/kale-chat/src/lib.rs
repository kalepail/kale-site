#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, panic_with_error, symbol_short, token, Address, Env,
    String, Symbol,
};

#[contracterror]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn __constructor(env: Env, asset: Address) {
        if env
            .storage()
            .instance()
            .has::<Symbol>(&symbol_short!("asset"))
        {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }

        env.storage()
            .instance()
            .set(&symbol_short!("asset"), &asset);
    }
    pub fn send(env: Env, addr: Address, msg: String) {
        addr.require_auth();

        let index = env
            .storage()
            .temporary()
            .get::<Address, u32>(&addr)
            .unwrap_or(0);
        let asset = env
            .storage()
            .instance()
            .get::<Symbol, Address>(&symbol_short!("asset"))
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized));

        token::Client::new(&env, &asset).burn(&addr, &(msg.len() as i128));

        // env.storage().temporary().set::<(Address, u32), String>(&(addr.clone(), index), &msg);
        env.storage()
            .temporary()
            .set::<Address, u32>(&addr, &(index.wrapping_add(1)));

        env.events().publish((addr.clone(), index), msg.clone());
    }
}

mod test;
