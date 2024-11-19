use core::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tiny_keccak::{Hasher, Keccak};
use rayon::prelude::*;
use wasm_bindgen::{prelude::*, Clamped};

pub use wasm_bindgen_rayon::init_thread_pool;

struct HashMiner {
    zeros: u32,
    num_threads: usize,
    chunk_size: u64,
    found: Arc<AtomicBool>,
}

#[wasm_bindgen(getter_with_clone)]
pub struct Return {
    pub start_nonce: u64,
    pub local_nonce: u64,
}

impl HashMiner {
    fn new(zeros: u32) -> Self {
        let num_threads = rayon::current_num_threads();

        Self {
            zeros,
            num_threads,
            chunk_size: u64::MAX / (num_threads as u64),
            found: Arc::new(AtomicBool::new(false)),
        }
    }

    fn check_difficulty(&self, hash: &[u8], difficulty: u32) -> bool {
        let first_bytes = u128::from_be_bytes(hash[0..16].try_into().unwrap());
        first_bytes.leading_zeros() >= difficulty * 4
    }

    fn mine_thread(&self, thread_id: usize) -> Option<Return> {
        let start_nonce = thread_id as u64 * self.chunk_size;
        let end_nonce = if thread_id == self.num_threads - 1 {
            u64::MAX
        } else {
            start_nonce + self.chunk_size
        };

        let mut local_hash = [0; 32];
        let mut local_hash_array = [0; 76];

        for local_nonce in start_nonce..end_nonce {
            if self.found.load(Ordering::Relaxed) {
                return None;
            }

            local_hash_array[4..12].copy_from_slice(&local_nonce.to_be_bytes());

            let mut keccak = Keccak::v256();
            keccak.update(&local_hash_array);
            keccak.finalize(&mut local_hash);

            if self.check_difficulty(&local_hash, self.zeros) {
                self.found.store(true, Ordering::Relaxed);
                return Some(Return { start_nonce, local_nonce });
            }
        }
        
        None
    }

    fn mine_parallel(&self) -> Option<Return> {
        (0..self.num_threads)
            .into_par_iter()
            .map(move |thread_id| self.mine_thread(thread_id))
            .find_any(move |result| result.is_some())
            .flatten()
    }
}

#[wasm_bindgen]
pub fn mine(zeros: u32) -> Clamped<Option<Return>> {
    Clamped(HashMiner::new(zeros).mine_parallel())
}
