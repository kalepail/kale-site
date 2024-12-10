use serde::Serialize;
use zephyr_sdk::{prelude::*, soroban_sdk::xdr::ScVal, EnvClient, DatabaseDerive};

#[derive(DatabaseDerive, Serialize, Clone)]
#[with_name("balances")]
pub struct Balances {
    pub address: ScVal,
    pub balance: u32,
}

#[no_mangle]
pub extern "C" fn on_close() {
    let env = EnvClient::new();

    for event in env.reader().pretty().soroban_events() {
        env.log().debug(format!("{:?}", event), None);
    }
}

#[no_mangle]
pub extern "C" fn debug_balances() {
    let env = EnvClient::empty();

    let balances = env.read::<Balances>();

    env.conclude(balances);
}
