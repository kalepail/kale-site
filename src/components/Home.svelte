<script lang="ts">
    loadWasm();

    let threads = navigator.hardwareConcurrency;
    let zeros = 5;
    let hash: string
    let pool: wasm_bindgen.WorkerPool;

    const { Scene, WorkerPool } = wasm_bindgen;

    // First up, but try to do feature detection to provide better error messages
    function loadWasm() {
        let msg = "This demo requires a current version of Firefox (e.g., 79.0)";
        
        if (typeof SharedArrayBuffer !== "function") {
            alert(
                "this browser does not have SharedArrayBuffer support enabled" +
                    "\n\n" +
                    msg,
            );
            return;
        }
        
        const buf = new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x05, 0x03, 0x01,
            0x00, 0x01, 0x0b, 0x03, 0x01, 0x01, 0x00,
        ]);
        
        if (!WebAssembly.validate(buf)) {
            alert(
                "this browser does not support passive Wasm memory, demo does not work" +
                    "\n\n" +
                    msg,
            );
            return;
        }

        wasm_bindgen().then(boot).catch(console.error);
    }

    function boot() {
        pool = new WorkerPool(navigator.hardwareConcurrency);
    }

    function render() {
        const state = new State(pool);
        state.render();
    }

    class State {
        rendering = false;
        pool: wasm_bindgen.WorkerPool;
        scene: wasm_bindgen.Scene;
        rendering_scene: wasm_bindgen.RenderingScene | null = null;

        constructor(pool: wasm_bindgen.WorkerPool) {
            this.pool = pool;
            this.scene = new Scene(zeros);
        }

        render() {
            if (this.rendering) 
                return;

            hash = "";

            this.rendering = true;
            this.rendering_scene = this.scene.render(Number(threads), this.pool);
            
            this.rendering_scene.promise()
                .then((data: Uint8Array) => {
                    hash = Array.from(data)
                        .map((byte) => byte.toString(16).padStart(2, "0"))
                        .join("");

                    this.rendering = false;
                })
                .catch(console.error);
        }
    }
</script>

<div class="flex flex-col">
    <div class="mb-5">
        <p># of threads: {threads}</p>
        <label for="">
            1
            <input type="range" min="1" max={navigator.hardwareConcurrency} bind:value={threads}>
            {navigator.hardwareConcurrency}
        </label>
    </div>

    <div class="mb-5">
        <p># of zeros: {zeros}</p>
        <label for="">
            0
            <input type="range" min="0" max="7" bind:value={zeros}>
            7
        </label>
    </div>

    <button class="bg-black text-white p-2 self-start mb-5" on:click={render}>Render</button>

    <pre><code>{hash}</code></pre>
</div>
