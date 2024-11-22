<script lang="ts">
    import { onMount } from "svelte";
    import { keyId } from "../store/keyId";
    import { contractId } from "../store/contractId";
    import { account, server } from "../utils/passkey-kit";
    import { truncate } from "../utils/base";
    import { contractBalance } from "../store/contractBalance";

    let creating = false;

    onMount(async () => {
        if ($keyId) {
            const { contractId: cid } = await account.connectWallet({
                keyId: $keyId,
            });

            contractId.set(cid);
        }
    });

    async function login() {
        const { keyId_base64, contractId: cid } = await account.connectWallet();

        keyId.set(keyId_base64);
        localStorage.setItem("kale:keyId", keyId_base64);

        contractId.set(cid);
    }

    async function signUp() {
        creating = true;

        try {
            const {
                keyId_base64,
                contractId: cid,
                built,
            } = await account.createWallet(
                "The KALEpail Project",
                "KALE Farmer",
            );

            await server.send(built);

            keyId.set(keyId_base64);
            localStorage.setItem("kale:keyId", keyId_base64);

            contractId.set(cid);
        } finally {
            creating = false;
        }
    }

    function logout() {
        keyId.set(null);
        contractId.set(null);
        localStorage.removeItem("kale:keyId");

        Object.keys(localStorage).forEach((key) => {
            if (key.includes("kale:")) {
                localStorage.removeItem(key);
            }
        });
    }
</script>

<header class="flex">
    <h1 class="text-xl mb-2">
        <a href="/"><strong>KALE</strong> 🥬</a>
    </h1>

    <div class="ml-auto flex items-center">
        {#if $contractId}
            <a
                class="mr-2 font-mono underline"
                href="https://stellar.expert/explorer/public/contract/{$contractId}"
                target="_blank">{truncate($contractId)}</a
            >
            |
            {(Number($contractBalance ?? 0) / 1e7)?.toLocaleString()} KALE
            <button class="text-white bg-black p-2 ml-2" on:click={logout}
                >Logout</button
            >
        {:else}
            <button class="underline mr-2" on:click={login}>Login</button>
            <button
                class="text-white bg-black p-2 disabled:bg-gray-400"
                on:click={signUp}
                disabled={creating}
                >{creating ? "Creating..." : "Create New Account"}</button
            >
        {/if}
    </div>
</header>
