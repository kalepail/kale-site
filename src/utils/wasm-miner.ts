import { threads } from "wasm-feature-detect";
import init, { initThreadPool } from "../../wasm-miner/pkg";

export async function loadWasm(thread_count: number) {
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