use serde::{Deserialize, Serialize};
use zephyr_sdk::{
    prelude::{Limits, WriteXdr},
    soroban_sdk::{
        self, contracttype, symbol_short,
        xdr::{LedgerEntry, LedgerEntryData, ScMapEntry, ScVal, ToXdr},
        Address, String as SorString, Symbol,
    },
    utils::address_to_alloc_string,
    ContractDataEntry, EnvClient,
};

#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    Balance(Address),
}
#[derive(Serialize, Deserialize)]
pub struct Balance {
    address: String,
    balance: String,
}
#[derive(Serialize, Deserialize)]
pub struct Request {
    contract: String,
}

#[no_mangle]
pub extern "C" fn debug_balances() {
    let env = EnvClient::empty();
    let req: Request = env.read_request_body();
    let mut balances: Vec<Balance> = Vec::new();

    let mut contract = [0u8; 32];
    let contract_address =
        Address::from_string(&SorString::from_str(&env.soroban(), &req.contract));
    let contract_bytes = contract_address.to_xdr(&env.soroban());

    contract_bytes
        .slice(contract_bytes.len() - 32..contract_bytes.len())
        .copy_into_slice(&mut contract);

    match env.read_contract_entries(contract) {
        Ok(result) => {
            for ContractDataEntry { entry, .. } in result {
                let LedgerEntry { data, .. } = entry;

                let mut address: Option<ScVal> = None;
                let mut balance: Option<ScVal> = None;

                match data {
                    LedgerEntryData::ContractData(entry) => {
                        match entry.key {
                            ScVal::Vec(Some(v)) => match v.get(0) {
                                Some(key) => match env.try_from_scval::<Symbol>(key) {
                                    Ok(key) => {
                                        if key == symbol_short!("Balance") {
                                            address = Some(v.get(1).unwrap().clone());
                                        }
                                    }
                                    Err(_) => {}
                                },
                                None => {}
                            },
                            _ => {}
                        }

                        match entry.val {
                            ScVal::Map(Some(m)) => {
                                for ScMapEntry { key, val } in m.0.iter() {
                                    match env.try_from_scval::<Symbol>(key) {
                                        Ok(key) => {
                                            if key == symbol_short!("amount") {
                                                balance = Some(val.clone());
                                            }
                                        }
                                        Err(_) => {}
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                    _ => {}
                }

                if address.is_some() && balance.is_some() {
                    balances.push(Balance {
                        address: address_to_alloc_string(&env, env.from_scval(&address.unwrap())),
                        balance: balance.unwrap().to_xdr_base64(Limits::none()).unwrap(),
                    });
                }
            }
        }
        Err(_) => {}
    }

    env.conclude(balances)
}
