<script lang="ts">
    import { threads } from "wasm-feature-detect";
    import init, { initThreadPool, mine } from "../../wasm-miner/pkg";

    let thread_count = navigator.hardwareConcurrency;
    let time_output = "";
    let zeros = 5;
    let nonce = 0n;
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
            const start = performance.now();
            const { start_nonce, local_nonce } = mine(Number(zeros))!;
            const time = performance.now() - start;
            const hashRate =
                Number((local_nonce - start_nonce) * BigInt(thread_count)) /
                (time / 1e3) /
                1e6;

            time_output = `${zeros} zeros : ${time.toFixed(2)} ms : ${hashRate.toFixed(2)} MH/s`;
            nonce = local_nonce;
            rendering = false;
        }, 10);
    }
</script>

<div class="flex flex-col">
    <!-- <div class="mb-5">
        <p># of threads: {thread_count}</p>
        <label for="">
            1
            <input type="range" min="1" max={navigator.hardwareConcurrency} bind:value={thread_count}>
            {navigator.hardwareConcurrency}
        </label>
    </div> -->

    <div class="mb-5">
        <p># of zeros: {zeros}</p>
        <label for="">
            0
            <input type="range" min="0" max="9" bind:value={zeros} />
            9
        </label>
    </div>

    <button
        class="{zeros > 8
            ? 'bg-red-600'
            : zeros > 7
              ? 'bg-orange-600'
              : zeros > 6
                ? 'bg-yellow-600'
                : 'bg-green-600'} text-white p-2 self-start mb-5 disabled:bg-gray-400"
        on:click={render}
        disabled={rendering}>Render{rendering ? "ing..." : ""}</button
    >

    <pre><code>Nonce: {nonce}</code></pre>
    <pre><code>{time_output}</code></pre>
</div>
