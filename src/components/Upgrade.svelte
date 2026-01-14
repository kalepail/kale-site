<script lang="ts">
    import { xdr } from "@stellar/stellar-sdk/minimal";
    import { contractId } from "../store/contractId";
    import { keyId } from "../store/keyId";
    import { rpc } from "../utils/kale";
    import { account, send } from "../utils/passkey-kit";

    let upgrading = false;

    let hash =
        "ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90";

    const safe_hashes = [
        hash,
        "b62f62217ff256d557513793e9e44317b25b14401a8a6b6149a04d38d72d6c7c",
    ];

    async function handleSubmit(event: Event) {
        try {
            upgrading = true;

            if (!$contractId || !$keyId) return;

            if (
                !confirm(
                    `Are you sure you know what you're doing? This action could completely lock or expose your wallet.`,
                )
            ) {
                return;
            }

            const current_hash = await rpc
                .getContractData(
                    $contractId,
                    xdr.ScVal.scvLedgerKeyContractInstance(),
                )
                .then(({ val }) =>
                    val
                        .contractData()
                        .val()
                        .instance()
                        .executable()
                        .wasmHash()
                        .toString("hex"),
                );

            if (current_hash === hash) {
                alert("Your wallet has already been upgraded");
                return;
            } else if (!safe_hashes.includes(current_hash)) {
                alert(
                    "Your wallet is not able to be upgraded. Please contact support.",
                );
                return;
            }

            const at = await account.wallet?.update_contract_code({
                hash: Buffer.from(hash, "hex"),
            });

            if (!at) {
                alert("Failed to create transaction");
                return;
            }

            try {
                await account.sign(at, { keyId: $keyId });
                await send(at);
            } catch (err) {
                console.error("Error sending transaction:", err);
                alert("Failed to send transaction");
                return;
            }

            alert("Wallet code upgraded successfully");
        } finally {
            upgrading = false;
        }
    }
</script>

<h1 class="text-xl font-bold mb-5">Upgrade your wallet code</h1>

<form class="flex flex-col items-start" on:submit|preventDefault={handleSubmit}>
    <div class="flex">
        <input
            class="px-2 py-1 border border-orange-500 text-sm font-mono min-w-[300px]"
            type="text"
            placeholder="WASM hash to upgrade to"
            bind:value={hash}
        />
        <button
            class="flex items-center bg-orange-500 text-white px-2 py-1 mr-2"
            type="submit">Upgrad{upgrading ? 'ing...' : 'e'}</button
        >
    </div>
</form>

<p
    class="text-xs mt-5 text-orange-500 border border-orange-500 inline-block rounded p-2 bg-orange-50"
>
    *Ensure you trust the WASM hash before upgrading
</p>
