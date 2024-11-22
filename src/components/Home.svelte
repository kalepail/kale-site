<script lang="ts">
    import { mine } from "../../wasm-miner/pkg";
    import { loadWasm } from "../utils/wasm-miner";

    let thread_count = navigator.hardwareConcurrency;
    let time_output: string;
    let nonce_count = thread_count * 10_000_000;
    let nonce: bigint;
    let hash: string;
    let farming = false;

    // Load block data
        // index
        // block

    // plant
    // mine a hash
    // work
    // harvest

    loadWasm(thread_count);

    async function generateHash() {
        farming = true;

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

                farming = false;
                nonce = max_nonce;
                hash = Array.from(local_hash)
                    .map(byte => byte.toString(16).padStart(2, '0'))
                    .join('');

                const zeros = hash.match(/^0*/)?.[0].length;
                
                time_output = `${zeros} zeros : ${time.toFixed(2)} ms : ${hash_rate.toFixed(2)} MH/s`;
            } finally {
                farming = false;
            }
        }, 10);
    }
</script>

<div class="flex flex-col">
    <button
        class="bg-black text-white p-2 self-start mb-5 disabled:bg-gray-400"
        on:click={generateHash}
        disabled={farming}>Farm{farming ? "ing..." : ""}</button
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
