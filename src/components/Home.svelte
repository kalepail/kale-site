<script lang="ts">
    loadWasm();

    let hash: string
    let threads = navigator.hardwareConcurrency;
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
            this.scene = new Scene;
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

<p># of threads: {threads}</p>
<label for="">
    1
    <input type="range" min="1" max={navigator.hardwareConcurrency} bind:value={threads}>
    {navigator.hardwareConcurrency}
</label>
<button on:click={render} class="bg-black text-white p-2">Render</button>
<pre><code>{hash}</code></pre>