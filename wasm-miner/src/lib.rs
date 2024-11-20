#![feature(duration_millis_float)]

use core::{sync::atomic::{AtomicU32, AtomicU64, Ordering}, time::Duration};
use rayon::prelude::*;
use sha3::{Digest, Keccak256};
use web_time::Instant;
use std::sync::Arc;
use wasm_bindgen::{prelude::*, Clamped};

pub use wasm_bindgen_rayon::init_thread_pool;

struct HashMiner {
    max_nonce: Arc<AtomicU64>,
    max_zeros: Arc<AtomicU32>,
    chunk_size: u64,
    thread_count: usize,
    hash_array: [u8; 76],
    ttl: Instant,
}

#[wasm_bindgen]
pub struct Nonce {
    pub start_nonce: u64,
    pub local_nonce: u64,
    pub max_nonce: u64,
}

impl HashMiner {
    fn new(
        thread_count: usize,
        runtime: u64,
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
            chunk_size: u64::MAX / (thread_count as u64),
            thread_count,
            hash_array,
            ttl: Instant::now().checked_add(Duration::new(runtime, 0)).unwrap(),
        }
    }

    fn check_zeros(&self, hash: &[u8]) -> bool {
        let zeros = unsafe { *(hash[0..16].as_ptr() as *const u128) }
            .swap_bytes()
            .leading_zeros();

        if zeros > self.max_zeros.load(Ordering::Relaxed) {
            self.max_zeros.store(zeros, Ordering::Relaxed);
            return true;
        }

        false
    }

    fn mine_thread(&self, thread_id: usize) -> Option<Nonce> {
        let start_nonce = thread_id as u64 * self.chunk_size;
        let end_nonce = if thread_id == self.thread_count - 1 {
            u64::MAX
        } else {
            start_nonce + self.chunk_size
        };

        let mut hasher = Keccak256::new();
        let mut local_hash_array = self.hash_array.clone();

        for local_nonce in start_nonce..end_nonce {
            if self.ttl.duration_since(Instant::now()).is_zero() {
                return Some(Nonce {
                    start_nonce,
                    local_nonce,
                    max_nonce: self.max_nonce.load(Ordering::Relaxed),
                });
            }

            unsafe {
                *(local_hash_array[4..12].as_mut_ptr() as *mut u64) = local_nonce.swap_bytes();
            }

            hasher.update(local_hash_array);
            let local_hash = hasher.finalize_reset();

            if self.check_zeros(&local_hash) {
                self.max_nonce.store(local_nonce, Ordering::Relaxed);
            }
        }

        None
    }

    fn mine_parallel(&self) -> Option<Nonce> {
        (0..self.thread_count)
            .into_par_iter()
            .map(move |thread_id| self.mine_thread(thread_id))
            .find_any(move |result| result.is_some())
            .flatten()
    }
}

#[wasm_bindgen]
pub fn mine(
    thread_count: usize,
    runtime: u64,
    index: u32,
    entropy: Vec<u8>,
    farmer: Vec<u8>,
) -> Clamped<Option<Nonce>> {
    Clamped(HashMiner::new(thread_count, runtime, index, entropy, farmer).mine_parallel())
}
