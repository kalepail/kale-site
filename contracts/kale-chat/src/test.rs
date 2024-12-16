#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, EnvTestConfig}, Address, Env, String};

#[test]
fn test() {
    let mut env = Env::default();

    env.set_config(EnvTestConfig {
        capture_snapshot_at_drop: false,
    });

    env.mock_all_auths();

    let sac_admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(sac_admin);
    let sac_address = sac.address();
    let sac_admin_client = token::StellarAssetClient::new(&env, &sac_address);
    // let sac_client = token::Client::new(&env, &sac_address);

    let contract_id = env.register(Contract, (&sac_address, ));
    let client = ContractClient::new(&env, &contract_id);

    let addr = Address::generate(&env);

    let msg1 = String::from_str(&env, "Hello World!");
    let msg2 = String::from_str(&env, "Goodnight Moon!");

    sac_admin_client.mint(&addr, &((msg1.len() + msg2.len()) as i128));

    client.send(&addr, &msg1);
    client.send(&addr, &msg2);
}
