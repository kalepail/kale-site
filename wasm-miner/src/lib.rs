use core::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use rayon::prelude::*;
use sha3::{Digest, Keccak256};
use wasm_bindgen::{prelude::*, Clamped};

pub use wasm_bindgen_rayon::init_thread_pool;

struct HashMiner {
    thread_count: usize,
    chunk_size: u64,
    found: Arc<AtomicBool>,
    hash_array: [u8; 76],
    min_zeros_binary: u32,
}

#[wasm_bindgen]
pub struct Return {
    pub start_nonce: u64,
    pub local_nonce: u64,
}

impl HashMiner {
    fn new(
        thread_count: usize,
        index: u32,
        entropy: Vec<u8>,
        farmer: Vec<u8>,
        min_zeros: u32,
    ) -> Self {
        let mut hash_array = [0; 76];

        hash_array[..4].copy_from_slice(&index.to_be_bytes());
        hash_array[12..44].copy_from_slice(&entropy);
        hash_array[44..].copy_from_slice(&farmer);

        Self {
            thread_count,
            chunk_size: u64::MAX / (thread_count as u64),
            found: Arc::new(AtomicBool::new(false)),
            hash_array,
            min_zeros_binary: min_zeros * 4,
        }
    }

    fn check_difficulty(&self, hash: &[u8]) -> bool {
        unsafe { *(hash[0..16].as_ptr() as *const u128) }
            .swap_bytes()
            .leading_zeros()
            >= self.min_zeros_binary
    }

    fn mine_thread(&self, thread_id: usize) -> Option<Return> {
        let start_nonce = thread_id as u64 * self.chunk_size;
        let end_nonce = if thread_id == self.thread_count - 1 {
            u64::MAX
        } else {
            start_nonce + self.chunk_size
        };

        let mut hasher = Keccak256::new();
        let mut local_hash_array = self.hash_array.clone();

        for local_nonce in start_nonce..end_nonce {
            if self.found.load(Ordering::Relaxed) {
                return None;
            }

            unsafe {
                *(local_hash_array[4..12].as_mut_ptr() as *mut u64) = local_nonce.swap_bytes();
            }

            hasher.update(local_hash_array);
            let local_hash = hasher.finalize_reset();

            if self.check_difficulty(&local_hash) {
                self.found.store(true, Ordering::Relaxed);

                return Some(Return {
                    start_nonce,
                    local_nonce,
                });
            }
        }
        
        None
    }

    fn mine_parallel(&self) -> Option<Return> {
        (0..self.thread_count)
            .into_par_iter()
            .map(move |thread_id| self.mine_thread(thread_id))
            .find_any(move |result| result.is_some())
            .flatten()
    }
}

#[wasm_bindgen]
pub fn mine(thread_count: usize, index: u32, entropy: Vec<u8>, farmer: Vec<u8>, min_zeros: u32) -> Clamped<Option<Return>> {
    Clamped(HashMiner::new(thread_count, index, entropy, farmer, min_zeros).mine_parallel())
}
