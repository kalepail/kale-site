# KALE site

Build the WASM
```
cd wasm-miner
make build
```

Run the site
```bash
pnpm i
pnpm start
```

### Attribution

* Uses the [wasm-bindgen-rayon](https://github.com/RReverser/wasm-bindgen-rayon) crate by [RReverser](https://github.com/RReverser)
* Original inspiration came from a [Parallel Raytracing demo](https://wasm-bindgen.netlify.app/examples/raytrace) on the [wasm-bindgen site](https://rustwasm.github.io/docs/wasm-bindgen/)