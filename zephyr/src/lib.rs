use serde::{Deserialize, Serialize};
use zephyr_sdk::{prelude::*, soroban_sdk::{self, contracttype, Address, String as SorString}, EnvClient};

// CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV
const CONTRACT: [u8; 32] = [ 117, 187, 68, 112, 177, 164, 255, 97, 236, 199, 41, 94, 139, 142, 183, 68, 25, 221, 88, 110, 238, 64, 76, 223, 82, 73, 145, 93, 137, 14, 8, 119 ];

#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    Balance(Address)
}
#[derive(Serialize, Deserialize)]
pub struct Balance {
    addr: String,
    balance: i128
}
#[derive(Serialize, Deserialize)]
pub struct Request {
    addresses: Vec<String>
}

#[no_mangle]
pub extern "C" fn debug_balances() {
    let env = EnvClient::empty();
    let req: Request = env.read_request_body();
    let mut balances: Vec<Balance> = Vec::new();
    
    for addr in req.addresses {
        // let source_addr = Address::from_string(&SorString::from_str(&env.soroban(), addr));
        
        // match env.read_contract_entry_by_key::<DataKey, i128>(CONTRACT, DataKey::Balance(source_addr)) {
        //     Ok(result) => {
        //         match result {
        //             Some(val) => {
        //                 balances.push(Balance { addr, balance: val })
        //             }
        //             None => {}
        //         }
        //     }
        //     Err(_) => {}
        // }

        balances.push(Balance { addr, balance: 0 })
    }

    env.conclude(balances)
}  





// use serde::Serialize;
// use zephyr_sdk::{prelude::*, soroban_sdk::{self, contracttype, symbol_short, xdr::{LedgerEntryData, ScVal}, Address, Symbol}, DatabaseDerive, EnvClient};

// // CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV
// const CONTRACT: [u8; 32] = [ 117, 187, 68, 112, 177, 164, 255, 97, 236, 199, 41, 94, 139, 142, 183, 68, 25, 221, 88, 110, 238, 64, 76, 223, 82, 73, 145, 93, 137, 14, 8, 119 ];

// #[derive(DatabaseDerive, Serialize, Clone)]
// #[with_name("balances")]
// pub struct Balances {
//     pub address: ScVal,
//     pub balance: u32,
// }

// #[no_mangle]
// pub extern "C" fn on_close() {
//     let env = EnvClient::new();

//     for event in env.reader().pretty().soroban_events() {
//         if event.contract == CONTRACT {
//             match event.topics.get(0) {
//                 Some(topic) => {
//                     let kind: Symbol = env.from_scval(topic);

//                     if 
//                         kind == symbol_short!("burn") ||
//                         kind == symbol_short!("clawback") ||
//                         kind == symbol_short!("mint") ||
//                         kind == symbol_short!("transfer")
//                     {
//                         match event.topics.get(1) {
//                             Some(topic) => {
//                                 process_balance(&env, topic);

//                                 match event.topics.get(2) {
//                                     Some(topic) => {
//                                         process_balance(&env, topic);
//                                     }
//                                     None => {}
//                                 }
//                             }
//                             None => {}
//                         }
//                     }

//                     // ["burn", from: Address]
//                     // ["clawback", admin: Address, to: Address]
//                     // ["mint", admin: Address, to: Address]
//                     // ["transfer", from: Address, to: Address]
//                 }
//                 None => {}
//             }
//         }
//     }
// }

// #[contracttype]
// pub enum DataKey {
//     Balance(Address)
// }

// fn process_balance(env: &EnvClient, address_scval: &ScVal) {
//     let address: Address = env.from_scval(address_scval);

//     let val1 = env.to_scval(symbol_short!("Balance"));
//     let val2 = env.to_scval(address);
//     let scval = ScVal::Vec(Some(vec![val1, val2].try_into().unwrap()));

//     match env.read_contract_entry_by_key(CONTRACT, DataKey::Balance(address)) {
//         Ok(result) => {
//             match result {
//                 Some(val) => {
//                     match val.entry.data {
//                         LedgerEntryData::ContractData(entry) => {
//                             let amount: i128 = env.from_scval(&entry.val);
                             
//                             // env.log().debug(format!("{:?}", amount), None);

//                             let table = Balances {
//                                 address: address_scval.clone(),
//                                 balance: amount as u32,
//                             };

//                             env.put(&table);
//                         }
//                         _ => {}
//                     }
//                 }
//                 None => {}
//             }
//         }
//         Err(_) => {}
//     }
// }

// #[no_mangle]
// pub extern "C" fn debug_balances() {
//     let env = EnvClient::empty();

//     let balances = env.read::<Balances>();

//     env.conclude(balances);
// }