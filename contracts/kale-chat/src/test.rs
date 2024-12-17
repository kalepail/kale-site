#![cfg(test)]

extern crate std;

use soroban_sdk::{testutils::{Address as _, EnvTestConfig}, token, xdr::{Hash, Limits, ScAddress, ScSymbol, ScVal, WriteXdr}, Address, Env, String};

use crate::{Contract, ContractClient};

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

#[test] 
fn test_misc() {
    let address1 = [0u8; 32];

    let val1 = ScVal::Symbol(ScSymbol("Balance".try_into().unwrap()));
    let val2 = ScVal::Address(ScAddress::Contract(Hash(address1)));

    let scval = ScVal::Vec(Some(std::vec![val1, val2].try_into().unwrap()));

    std::println!("{:?}", scval.to_xdr_base64(Limits::none()));
}