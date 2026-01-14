<script lang="ts">
    import { onMount } from "svelte";
    import { keyId } from "../store/keyId";
    import { contractId } from "../store/contractId";
    import { account, send } from "../utils/passkey-kit";
    import { truncate } from "../utils/base";
    import {
        contractBalance,
        updateContractBalance,
    } from "../store/contractBalance";
    import copy from 'copy-to-clipboard'

    let creating = false;

    onMount(async () => {
        if ($keyId) {
            const { contractId: cid } = await account.connectWallet({
                keyId: $keyId,
                walletPublicKey: import.meta.env.PUBLIC_FACTORY_CONTRACT_ID,
            });

            contractId.set(cid);
        }
    });

    contractId.subscribe(async (cid) => {
        if (!cid) return;
        await updateContractBalance(cid);
    });

    async function login() {
        const { keyIdBase64, contractId: cid } = await account.connectWallet({
            walletPublicKey: import.meta.env.PUBLIC_FACTORY_CONTRACT_ID,
        });

        keyId.set(keyIdBase64);
        localStorage.setItem("kale:keyId", keyIdBase64);

        contractId.set(cid);
    }

    async function signUp() {
        creating = true;

        try {
            const {
                keyIdBase64,
                contractId: cid,
                signedTx,
            } = await account.createWallet(
                "The KALEpail Project",
                "KALE Farmer",
            );

            await send(signedTx);

            keyId.set(keyIdBase64);
            localStorage.setItem("kale:keyId", keyIdBase64);

            contractId.set(cid);
        } finally {
            creating = false;
        }
    }

    function copyContractId() {
        if ($contractId) {
            copy($contractId);
            alert("Contract id copied to clipboard");
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

    <div class="[&>a]:underline ml-auto pl-2">
        <a href="/leaderboard">Leaderboard</a>
        <span class="mx-1">|</span>
        <a href="/about">About</a>
        <span class="mx-1">|</span>
        <a href="/chat">Chat</a>
        <span class="mx-1">|</span>
        <a href="https://kalepail.com/kale" target="_blank">Lore</a>
    </div>

    <div class="flex items-center ml-auto pl-2">
        {#if $contractId}
            <a
                class="mr-2 font-mono text-sm underline"
                href="https://stellar.expert/explorer/public/contract/{$contractId}"
                target="_blank">{truncate($contractId, 4)}</a
            >
            <button class="mr-2 text-xl" on:click={copyContractId}>⧉</button>
            <span
                class="bg-green-700 text-white px-3 py-1 rounded-full font-mono text-sm"
                >{Number($contractBalance ?? 0) / 1e7} KALE</span
            >
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
