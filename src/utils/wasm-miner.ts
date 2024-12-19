import { threads } from "wasm-feature-detect";
import init, { initThreadPool, mine } from "../../wasm-miner/pkg";

const thread_count = navigator.hardwareConcurrency;
const nonce_count = thread_count * 10_000_000;

export async function loadWasm() {
    // Do some feature detection to provide better error messages
    if (!(await threads())) {
        alert("this browser does not support multi threading");
        return;
    }

    if (typeof SharedArrayBuffer !== "function") {
        alert(
            "this browser does not have SharedArrayBuffer support enabled",
        );
        return;
    }

    // Test for bulk memory operations with passive data segments
    // (module (memory 1) (data passive ""))
    const buf = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x05, 0x03, 0x01,
        0x00, 0x01, 0x0b, 0x03, 0x01, 0x01, 0x00,
    ]);

    if (!WebAssembly.validate(buf)) {
        alert("this browser does not support passive Wasm memory");
        return;
    }

    try {
        await init();
        await initThreadPool(thread_count);
    } catch { }
}

export function doWork(index: number, entropy: Uint8Array, farmer: Uint8Array) {
    return mine(
        thread_count,
        BigInt(nonce_count),
        index,
        entropy,
        farmer,
    );

    // const start = performance.now();

    //// MINE HERE

    // const time = performance.now() - start;
    // const hash_rate = nonce_count / (time / 1e3) / 1e6;

    // farming = false;
    // nonce = max_nonce;
    // hash = Array.from(local_hash)
    //     .map((byte) => byte.toString(16).padStart(2, "0"))
    //     .join("");

    // const zeros = hash.match(/^0*/)?.[0].length;

    // time_output = `${zeros} zeros : ${time.toFixed(2)} ms : ${hash_rate.toFixed(2)} MH/s`;
}