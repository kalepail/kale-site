use futures_channel::oneshot;
use js_sys::Promise;
use rayon::prelude::*;
use tiny_keccak::{Hasher, Keccak};
use wasm_bindgen::prelude::*;

macro_rules! console_log {
    ($($t:tt)*) => (crate::log(&format_args!($($t)*).to_string()))
}

mod pool;

#[inline(always)]
fn check_difficulty(hash: &[u8], difficulty: u32) -> bool {
    let first_bytes = u128::from_be_bytes(hash[0..16].try_into().unwrap());
    first_bytes.leading_zeros() >= difficulty * 4
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn logv(x: &JsValue);
}

#[wasm_bindgen]
pub struct Scene {
    zeros: u32,
}

#[wasm_bindgen]
impl Scene {
    /// Creates a new scene from the JSON description in `object`, which we
    /// deserialize here into an actual scene.
    #[wasm_bindgen(constructor)]
    pub fn new(zeros: u32) -> Result<Scene, JsValue> {
        console_error_panic_hook::set_once();
        Ok(Scene { zeros })
    }

    /// Renders this scene with the provided concurrency and worker pool.
    ///
    /// This will spawn up to `concurrency` workers which are loaded from or
    /// spawned into `pool`. The `RenderingScene` state contains information to
    /// get notifications when the render has completed.
    pub fn render(
        self,
        concurrency: usize,
        pool: &pool::WorkerPool,
    ) -> Result<RenderingScene, JsValue> {
        let mut hash = vec![0; 32];

        // Configure a rayon thread pool which will pull web workers from
        // `pool`.
        let thread_pool = rayon::ThreadPoolBuilder::new()
            .num_threads(concurrency)
            .spawn_handler(|thread| {
                pool.run(|| thread.run()).unwrap();
                Ok(())
            })
            .build()
            .unwrap();

        // And now execute the render! The entire render happens on our worker
        // threads so we don't lock up the main thread, so we ship off a thread
        // which actually does the whole rayon business. When our returned
        // future is resolved we can pull out the final version of the image.
        let (tx, rx) = oneshot::channel();

        pool.run(move || {
            thread_pool.install(|| {
                let num_threads = rayon::current_num_threads();
                let chunk_size = u64::MAX / (num_threads as u64);
                let found = std::sync::atomic::AtomicBool::new(false);
                let found = std::sync::Arc::new(found);

                let result = (0..num_threads)
                    .into_par_iter()
                    .map_with(found.clone(), |found, thread_id| {
                        let start_nonce = thread_id as u64 * chunk_size;
                        let end_nonce = if thread_id == num_threads - 1 {
                            u64::MAX
                        } else {
                            start_nonce + chunk_size
                        };

                        let mut local_hash = [0; 32];
                        let mut local_hash_array = [0; 76];

                        for nonce in start_nonce..end_nonce {
                            if found.load(std::sync::atomic::Ordering::Relaxed) {
                                return None;
                            }

                            local_hash_array[4..12].copy_from_slice(&nonce.to_be_bytes());

                            let mut keccak = Keccak::v256();
                            keccak.update(&local_hash_array);
                            keccak.finalize(&mut local_hash);

                            if check_difficulty(&local_hash, self.zeros) {
                                found.store(true, std::sync::atomic::Ordering::Relaxed);
                                return Some((local_hash, nonce));
                            }
                        }
                        None
                    })
                    .find_first(|result| result.is_some())
                    .flatten();

                if let Some((found_hash, _nonce)) = result {
                    hash = found_hash.into();
                }
            });

            drop(tx.send(hash));
        })?;

        let done = async move {
            match rx.await {
                Ok(data) => Ok(data.into()),
                Err(_) => Err(JsValue::undefined()),
            }
        };

        Ok(RenderingScene {
            promise: wasm_bindgen_futures::future_to_promise(done),
        })
    }
}

#[wasm_bindgen]
pub struct RenderingScene {
    promise: Promise,
}

#[wasm_bindgen]
impl RenderingScene {
    /// Returns the JS promise object which resolves when the render is complete
    pub fn promise(&self) -> Promise {
        self.promise.clone()
    }
}
