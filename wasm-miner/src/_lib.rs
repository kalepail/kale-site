use tiny_keccak::{Hasher, Keccak};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(getter_with_clone)]
pub struct Response {
    pub hash: String,
    pub nonce: u64,
}

#[inline(always)]
fn check_difficulty(hash: &[u8], difficulty: u32) -> bool {
    let first_bytes = u128::from_be_bytes(hash[0..16].try_into().unwrap());
    first_bytes.leading_zeros() >= difficulty * 4
}

#[wasm_bindgen]
pub fn generate_hash_and_nonce(index: u32, entropy_hex: String, farmer_hex: String, min_zeros: u32) -> Response {
    let entropy: [u8; 32] = hex::decode(entropy_hex).unwrap().try_into().unwrap();
    let farmer: [u8; 32] = hex::decode(farmer_hex).unwrap().try_into().unwrap();

    let mut hash_array = [0; 76];

    hash_array[..4].copy_from_slice(&index.to_be_bytes());
    hash_array[12..44].copy_from_slice(&entropy);
    hash_array[44..].copy_from_slice(&farmer);

    let mut hash = [0u8; 32];
    let mut nonce: u64 = 0; // thread_nonce;

    loop {
        hash_array[4..12].copy_from_slice(&nonce.to_be_bytes());

        let mut keccak = Keccak::v256();
        keccak.update(&hash_array);
        keccak.finalize(&mut hash);

        if check_difficulty(&hash, min_zeros) {
            return Response {
                hash: hex::encode(hash),
                nonce,
            }
        }

        nonce += 1;
    }
}
