default: build

all: test

test: build
	cargo test

build:
	stellar contract build
	@ls -l target/wasm32-unknown-unknown/release/*.wasm

deploy:
	stellar contract deploy --wasm target/wasm32-unknown-unknown/release/kale_chat.wasm --network testnet --source default -- --asset CDQKZ76ZS7LYDOZ2E7OG5LUJEWDDUNYBVYRJTBJK6645DZBNJWA7DXCR

fmt:
	cargo fmt --all

clean:
	cargo clean
