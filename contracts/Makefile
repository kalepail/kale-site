default: build

all: test

test: build
	cargo test

build:
	stellar contract build
	@ls -l target/wasm32-unknown-unknown/release/*.wasm

optimize:
	stellar contract build
	stellar contract optimize --wasm target/wasm32-unknown-unknown/release/kale_chat.wasm

deploy:
	stellar contract deploy --wasm target/wasm32-unknown-unknown/release/kale_chat.optimized.wasm --network testnet --source default -- --asset CDQKZ76ZS7LYDOZ2E7OG5LUJEWDDUNYBVYRJTBJK6645DZBNJWA7DXCR

bindings:
	stellar contract bindings typescript --wasm target/wasm32-unknown-unknown/release/kale_chat.wasm --output-dir ../kale-chat-sdk --overwrite 

fmt:
	cargo fmt --all

clean:
	cargo clean
