#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test() {
    let env = Env::default();

    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let sac_admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(sac_admin);
    let sac_address = sac.address();
    let sac_admin_client = token::StellarAssetClient::new(&env, &sac_address);
    // let sac_client = token::Client::new(&env, &sac_address);

    let addr = Address::generate(&env);

    let msg1 = String::from_str(&env, "Hello World!");
    let msg2 = String::from_str(&env, "Goodnight Moon!");

    sac_admin_client.mint(&addr, &((msg1.len() + msg2.len()) as i128));

    client.init(&sac_address);

    client.send(&addr, &msg1);
    client.send(&addr, &msg2);
}
