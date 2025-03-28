<script lang="ts">
    import { contractId } from "../store/contractId";
    import { keyId } from "../store/keyId";
    import { account, server } from "../utils/passkey-kit";

    let hash = 'ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90';

    async function handleSubmit(event: Event) {
        if (!$contractId || !$keyId) return;

        if (!confirm(`Are you sure you know what you're doing? This action could completely lock or expose your wallet.`)) {
            return;
        }

        const at = await account.wallet!.update_contract_code({
            hash: Buffer.from(hash, 'hex'),
        })

        await account.sign(at, { keyId: $keyId });

        await server.send(at);
    }
</script>

<h1 class="text-xl font-bold mb-5">
    Upgrade your wallet code
</h1>

<form class="flex flex-col items-start" on:submit|preventDefault={handleSubmit}>
    <div class="flex">
        <input class="px-2 py-1 border border-orange-500 text-sm font-mono min-w-[300px]" type="text" placeholder="WASM hash to upgrade to" bind:value={hash}>
        <button class="flex items-center bg-orange-500 text-white px-2 py-1 mr-2" type="submit">Upgrade</button>
    </div>
</form>

<p class="text-xs mt-5 text-orange-500 border border-orange-500 inline-block rounded p-2 bg-orange-50">*Ensure you trust the WASM hash before upgrading</p>