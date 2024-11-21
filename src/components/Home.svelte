<script lang="ts">
    import { threads } from "wasm-feature-detect";
    import init, { initThreadPool, mine } from "../../wasm-miner/pkg";

    let thread_count = navigator.hardwareConcurrency;
    let time_output = "";
    let nonce_count = thread_count * 10_000_000;
    let nonce = 0n;
    let hash = "";
    let rendering = false;

    loadWasm();

    // First up, but try to do feature detection to provide better error messages
    async function loadWasm() {
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
        } catch {}
    }

    async function render() {
        rendering = true;

        setTimeout(() => {
            try {
                const index = Number(Math.random().toString().substring(2));
                const entropy = new Uint8Array(32);
                const farmer = new Uint8Array(32);
                const start = performance.now();

                const {
                    max_nonce,
                    local_hash
                } = mine(
                    thread_count,
                    BigInt(nonce_count),
                    index,
                    entropy,
                    farmer,
                )!;

                const time = performance.now() - start;
                const hash_rate =
                    nonce_count /
                    (time / 1e3) /
                    1e6;

                rendering = false;
                nonce = max_nonce;
                hash = Array.from(local_hash)
                    .map(byte => byte.toString(16).padStart(2, '0'))
                    .join('');

                const zeros = hash.match(/^0*/)[0].length;
                
                time_output = `${zeros} zeros : ${time.toFixed(2)} ms : ${hash_rate.toFixed(2)} MH/s`;
            } finally {
                rendering = false;
            }
        }, 10);
    }
</script>

<div class="flex flex-col">
    <div class="mb-5">
        <p># of threads: {thread_count}</p>
        <label for="">
            1
            <input
                type="range"
                min="1"
                max={navigator.hardwareConcurrency}
                bind:value={thread_count}
            />
            {navigator.hardwareConcurrency}
        </label>
    </div>

    <div class="mb-5">
        <p>nonces: {nonce_count.toLocaleString()}</p>
        <label for="">
            1
            <input type="range" min="1" max="1000000000" bind:value={nonce_count} />
            {(1000000000).toLocaleString()}
        </label>
    </div>

    <button
        class="bg-black text-white p-2 self-start mb-5 disabled:bg-gray-400"
        on:click={render}
        disabled={rendering}>Render{rendering ? "ing..." : ""}</button
    >

    <pre><code>Nonce: {nonce}</code></pre>
    <pre><code>Hash: {hash}</code></pre>
    <pre><code>{time_output}</code></pre>

    <p class="mt-10">
        Learn more about <a
            class="underline text-blue-600"
            href="https://github.com/kalepail/KALE-sc"
            target="_blank">The KALEpail Project</a
        >
    </p>
</div>
