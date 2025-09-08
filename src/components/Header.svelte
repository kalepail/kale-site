<script lang="ts">
    import { onMount } from "svelte";
    import { keyId } from "../store/keyId";
    import { contractId } from "../store/contractId";
    import { account, setLTHeaders, server } from "../utils/passkey-kit";
    import { truncate } from "../utils/base";
    import {
        contractBalance,
        updateContractBalance,
    } from "../store/contractBalance";
    import { turnstileToken } from "../store/turnstileToken";
    import copy from 'copy-to-clipboard'
    import { triggerExplosion } from '../store/animations';

    let creating = false;
    let animationEnabled = true;
    
    function handleGlobalClick(event: MouseEvent) {
        if (animationEnabled) {
            triggerExplosion(event.clientX, event.clientY);
        }
    }

    onMount(async () => {
        if ($keyId) {
            const { contractId: cid } = await account.connectWallet({
                keyId: $keyId,
                walletPublicKey: import.meta.env.PUBLIC_FACTORY_CONTRACT_ID,
            });

            contractId.set(cid);
        }
        
        // Add global click listener
        document.addEventListener('click', handleGlobalClick);
        
        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    });

    turnstileToken.subscribe((token) => {
        if (token) {
            setLTHeaders(token);
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

            await server.send(signedTx);

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

<header class="bg-white/95 backdrop-blur border-b border-green-200 sticky top-0 z-40 mb-6">
    <div class="px-6 py-4">
        <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-bold text-green-800 flex items-center gap-2">
                <a href="/" class="hover:text-green-600 transition-colors">
                    KALE
                </a>
                <label class="flex items-center gap-2 cursor-pointer">
                    <input
                        class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        type="checkbox"
                        bind:checked={animationEnabled}
                        title={animationEnabled ? "Disable cool mode" : "Enable cool mode"}
                    />
                    <span class="text-sm font-medium text-gray-600 flex items-center gap-1">
                        {animationEnabled ? "🎆" : "🎇"}
                        Cool mode
                    </span>
                </label>
            </h1>
            
            {#if $contractId}
                <div class="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full font-bold">
                    <span>{Number($contractBalance ?? 0) / 1e7} KALE</span>
                </div>
            {/if}
        </div>
        
        <div class="flex items-center justify-between">
            <nav class="flex items-center gap-6">
                <a href="/" class="text-green-700 hover:text-green-600 font-medium transition-colors px-2 py-1">
                    Home
                </a>
                <a href="/demo" class="text-green-700 hover:text-green-600 font-medium transition-colors px-2 py-1">
                    Demo
                </a>
                <a href="/leaderboard" class="text-green-700 hover:text-green-600 font-medium transition-colors px-2 py-1">
                    Leaderboard
                </a>
                <a href="/about" class="text-green-700 hover:text-green-600 font-medium transition-colors px-2 py-1">
                    About
                </a>
                <a href="/chat" class="text-green-700 hover:text-green-600 font-medium transition-colors px-2 py-1">
                    Chat
                </a>
            </nav>

            <div class="flex items-center gap-3">
                {#if $contractId}
                    <a
                        class="font-mono text-sm text-green-600 hover:text-green-800 underline"
                        href="https://stellar.expert/explorer/public/contract/{$contractId}"
                        target="_blank"
                    >
                        {truncate($contractId, 4)}
                    </a>
                    <button 
                        class="text-green-600 hover:text-green-800 text-sm font-medium transition-colors" 
                        on:click={copyContractId}
                        title="Copy Contract ID"
                    >
                        Copy
                    </button>
                    <button 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors" 
                        on:click={logout}
                    >
                        Logout
                    </button>
                {:else}
                    <button 
                        class="text-green-700 hover:text-green-600 font-medium transition-colors" 
                        on:click={login}
                    >
                        Login
                    </button>
                    <button
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400"
                        on:click={signUp}
                        disabled={creating}
                    >
                        {creating ? "Creating..." : "Create New Account"}
                    </button>
                {/if}
            </div>
        </div>
    </div>
</header>
