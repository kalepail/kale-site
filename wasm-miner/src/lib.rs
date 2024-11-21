#![feature(duration_millis_float)]

use core::sync::atomic::{AtomicU32, AtomicU64, Ordering};
use rayon::prelude::*;
use sha3::{Digest, Keccak256};
use std::sync::Arc;
use wasm_bindgen::prelude::*;

pub use wasm_bindgen_rayon::init_thread_pool;

struct HashMiner {
    max_nonce: Arc<AtomicU64>,
    max_zeros: Arc<AtomicU32>,
    chunk_size: u64,
    thread_count: usize,
    hash_array: [u8; 76],
}

#[wasm_bindgen]
pub struct Nonce {
    max_nonce: u64,
    local_hash: Vec<u8>,
}

#[wasm_bindgen]
impl Nonce {
    #[wasm_bindgen(constructor)]
    pub fn new(max_nonce: u64, local_hash: Vec<u8>) -> Nonce {
        Nonce { max_nonce, local_hash }
    }

    #[wasm_bindgen(getter)]
    pub fn max_nonce(&self) -> u64 {
        self.max_nonce
    }

    #[wasm_bindgen(getter)]
    pub fn local_hash(&self) -> Vec<u8> {
        self.local_hash.clone() // Return a clone to ensure safe transfer
    }
}


impl HashMiner {
    fn new(
        thread_count: usize,
        nonce_count: u64,
        index: u32,
        entropy: Vec<u8>,
        farmer: Vec<u8>,
    ) -> Self {
        let mut hash_array = [0; 76];

        hash_array[..4].copy_from_slice(&index.to_be_bytes());
        hash_array[12..44].copy_from_slice(&entropy);
        hash_array[44..].copy_from_slice(&farmer);

        Self {
            max_nonce: Arc::new(AtomicU64::new(0)),
            max_zeros: Arc::new(AtomicU32::new(0)),
            chunk_size: nonce_count / (thread_count as u64),
            thread_count,
            hash_array,
        }
    }

    fn check_zeros(&self, hash: &[u8]) -> bool {
        let zeros = u128::from_be_bytes(hash[..16].try_into().unwrap()).leading_zeros();

        if zeros > self.max_zeros.load(Ordering::Relaxed) {
            self.max_zeros.store(zeros, Ordering::Relaxed);
            return true;
        }

        false
    }

    fn mine_thread(&self, thread_id: usize) {
        let start_nonce = thread_id as u64 * self.chunk_size;
        let end_nonce = start_nonce.saturating_add(self.chunk_size);

        let mut hasher = Keccak256::new();
        let mut local_hash_array = self.hash_array.clone();

        for local_nonce in start_nonce..end_nonce {
            local_hash_array[4..12].copy_from_slice(&local_nonce.to_be_bytes());

            hasher.update(local_hash_array);

            if self.check_zeros(&hasher.finalize_reset()) {
                self.max_nonce.store(local_nonce, Ordering::Relaxed);
            }
        }
    }

    fn mine_parallel(&self) -> Nonce {
        (0..self.thread_count)
            .into_par_iter()
            .for_each(move |thread_id| self.mine_thread(thread_id));

        let mut hasher = Keccak256::new();
        let mut local_hash_array = self.hash_array.clone();
        let max_nonce = self.max_nonce.load(Ordering::Relaxed);

        local_hash_array[4..12].copy_from_slice(&max_nonce.to_be_bytes());

        hasher.update(local_hash_array);
        let local_hash: &[u8] = &hasher.finalize();

        return Nonce { max_nonce, local_hash: local_hash.to_vec() };
    }
}

#[wasm_bindgen]
pub fn mine(
    thread_count: usize,
    nonce_count: u64,
    index: u32,
    entropy: Vec<u8>,
    farmer: Vec<u8>,
) -> Nonce {
    HashMiner::new(thread_count, nonce_count, index, entropy, farmer).mine_parallel()
}
