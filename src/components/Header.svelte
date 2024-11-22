<script lang="ts">
    import { onMount } from "svelte";
    import { keyId } from "../store/keyId";
    import { contractId } from "../store/contractId";
    import { account, server } from "../utils/passkey-kit";

    onMount(async () => {
        if ($keyId) {
            const { contractId: cid } = await account.connectWallet({ keyId: $keyId });

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
        const {
            keyId_base64,
            contractId: cid,
            built,
        } = await account.createWallet("The KALEpail Project", "KALE Farmer");

        await server.send(built);

        keyId.set(keyId_base64);
        localStorage.setItem("kale:keyId", keyId_base64);

        contractId.set(cid);
    }

    function truncate(str: string) {
        return `${str.slice(0, 5)}...${str.slice(-5)}`;
    }

    function logout() {
        keyId.set(null);
        contractId.set(null);
        localStorage.removeItem("kale:keyId");
    }
</script>

<header class="flex">
    <h1 class="text-xl mb-2">
        <a href="/"><strong>KALE</strong> 🥬</a>
    </h1>

    <div class="ml-auto flex items-center">
        {#if $contractId}
            <pre class="mr-2"><code>{truncate($contractId)}</code></pre>
            <button class="text-white bg-black p-2" on:click={logout}>Logout</button>
        {:else}
            <button class="underline mr-2" on:click={login}>Login</button>
            <button
                class="text-white bg-black p-2"
                on:click={signUp}>Create New Account</button
            >
        {/if}
    </div>
</header>
