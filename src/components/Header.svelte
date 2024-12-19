<script lang="ts">
    import { onMount } from "svelte";
    import { keyId } from "../store/keyId";
    import { contractId } from "../store/contractId";
    import { account, server } from "../utils/passkey-kit";
    import { truncate } from "../utils/base";
    import { contractBalance, updateContractBalance } from "../store/contractBalance";

    let creating = false;

    onMount(async () => {
        if ($keyId) {
            const { contractId: cid } = await account.connectWallet({
                keyId: $keyId,
            });

            contractId.set(cid);
        }
    });

    contractId.subscribe(async (cid) => {
        if (!cid) return;
        await updateContractBalance(cid);
    })

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

        Object.keys(localStorage).forEach((key) => {
            if (key.includes("kale:")) {
                localStorage.removeItem(key);
            }
        });

        Object.keys(sessionStorage).forEach((key) => {
            if (key.includes("kale:")) {
                sessionStorage.removeItem(key);
            }
        });

        location.reload();
    }
</script>

<header class="flex items-center flex-wrap mb-2">
    <h1 class="flex items-center text-xl mr-auto">
        <a href="/"><strong>KALE</strong> 🥬</a>
    </h1>

    <div class="[&>a]:underline">
        <a href="/leaderboard">Leaderboard</a>
        <span class="mx-2">|</span>
        <a href="/chat">Chat</a>
        <span class="mx-2">|</span>
        <a href="https://kalepail.com/kale" target="_blank">Lore</a>
    </div>

    <div class="flex items-center ml-auto">
        {#if $contractId}
            <a
                class="mr-2 font-mono text-sm underline"
                href="https://stellar.expert/explorer/public/contract/{$contractId}"
                target="_blank">{truncate($contractId, 4)}</a
            >
            <span class="bg-green-700 text-yellow-100 px-3 py-1 rounded-full font-mono text-sm">{(Number($contractBalance ?? 0) / 1e7)} KALE</span>
            <button class="text-white bg-black px-2 py-1 ml-2" on:click={logout}
                >Logout</button
            >
        {:else}
            <button class="underline mr-2" on:click={login}>Login</button>
            <button
                class="text-white bg-black px-2 py-1 disabled:bg-gray-400"
                on:click={signUp}
                disabled={creating}
                >{creating ? "Creating..." : "Create New Account"}</button
            >
        {/if}
    </div>
</header>
