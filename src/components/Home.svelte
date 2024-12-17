<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import {
        contract,
        getBlock,
        getContractData,
        getIndex,
        rpc,
        type Block,
        type Pail,
    } from "../utils/kale";
    import { doWork, loadWasm } from "../utils/wasm-miner";
    import { contractId } from "../store/contractId";
    import { localStorageToMap, truncate } from "../utils/base";
    import { Address, Keypair } from "@stellar/stellar-sdk";
    import { Api } from "@stellar/stellar-sdk/rpc";
    import { account, kale, server } from "../utils/passkey-kit";
    import { keyId } from "../store/keyId";
    import { contractBalance, updateContractBalance } from "../store/contractBalance";
    import { SignerStore, type SignerLimits } from "passkey-kit";

    let interval: NodeJS.Timeout;

    let index: number;
    let block: Block | undefined;
    let pail: Pail | undefined;

    let blocks: Map<number, Block | undefined> = new Map();
    let pails: Map<number, [boolean, boolean]> = new Map();

    let automated = false;
    let automating = false;
    let planting = false;
    let working = false;
    let harvesting = false;
    let transferring = false;
    let stake = 0;

    let send_address: string;
    let send_amount: string;

    onMount(async () => {
        loadWasm();
        pails = localStorageToMap();
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    contractId.subscribe(async (cid) => {
        if (!cid) return;

        const data = await getContractData(cid);

        index = data.index;
        block = data.block;
        pail = data.pail;

        blocks.set(index, block);
        blocks = blocks;

        if (interval) clearInterval(interval);

        interval = setInterval(
            () =>
                getIndex().then(async (next_index) => {
                    if (next_index > index) {
                        index = next_index;
                        block = await getBlock(index);
                        blocks.set(index, block);
                        blocks = blocks;
                    } else {
                        blocks = blocks;
                    }

                    const secret = sessionStorage.getItem(`kale:secret`);

                    if (secret && !automating && automated) {
                        await harvest(index - 1);

                        let [planted, worked] = pails.get(next_index) ?? [
                            false,
                            false,
                        ];

                        try {
                            automating = true;

                            if (!planted) {
                                await plant(index, Keypair.fromSecret(secret));
                            }

                            const now = Math.floor(Date.now() / 1000);
                            const diff = now - Number(block?.timestamp);

                            // wait 4 minutes after block open to work
                            if (!worked && diff >= 240) {
                                await work();
                            }
                        } finally {
                            automating = false;
                        }
                    }
                }),
            5000,
        );
    });

    async function plant(i?: number, keypair?: Keypair) {
        if (!$contractId) return;

        planting = true;

        try {
            let amount = BigInt(Math.floor((Number($contractBalance) || 0) * (stake / 100)));
            let at = await contract.plant({
                farmer: $contractId,
                amount,
            });            

            if (Api.isSimulationError(at.simulation!)) {
                if (at.simulation.error.includes("Error(Contract, #8)")) {
                    // PailExists
                    console.log("Already planted");
                } else {
                    console.error("Plant Error:", at.simulation.error);
                    return;
                }
            } else {
                // @ts-ignore
                at = await account.sign(
                    // @ts-ignore
                    at,
                    keypair ? { keypair } : { keyId: $keyId },
                );

                // @ts-ignore
                await server.send(at);

                await updateContractBalance($contractId);

                console.log("Successfully planted", amount);
            }

            localStorage.setItem(
                `kale:${i ?? index}:plant`,
                Date.now().toString(),
            );
            pails = localStorageToMap();
        } finally {
            planting = false;
        }
    }

    async function work() {
        if (!$contractId || !block?.entropy) return;

        working = true;

        try {
            const { max_nonce, local_hash } = await new Promise<{
                max_nonce: bigint;
                local_hash: Uint8Array;
            }>((resolve) => {
                setTimeout(() => {
                    const work = doWork(
                        index,
                        block!.entropy!,
                        Address.fromString($contractId).toBuffer(),
                    );

                    resolve(work);
                }, 10);
            });

            const at = await contract.work({
                farmer: $contractId,
                hash: Buffer.from(local_hash),
                nonce: max_nonce,
            });

            if (Api.isSimulationError(at.simulation!)) {
                if (at.simulation.error.includes("Error(Contract, #7)")) {
                    // ZeroCountTooLow
                    console.log("Already worked");
                } else {
                    console.error("Work Error:", at.simulation.error);
                    return;
                }
            } else {
                // @ts-ignore
                await server.send(at);

                console.log("Successfully worked", at.result);
            }

            localStorage.setItem(`kale:${index}:work`, Date.now().toString());
            pails = localStorageToMap();
        } finally {
            working = false;
        }
    }

    async function harvest(index: number) {
        if (!$contractId) return;

        harvesting = true;

        try {
            const at = await contract.harvest({
                farmer: $contractId,
                index,
            });

            if (Api.isSimulationError(at.simulation!)) {
                if (
                    !(
                        (
                            at.simulation.error.includes(
                                "Error(Contract, #9)",
                            ) || // PailMissing
                            at.simulation.error.includes(
                                "Error(Contract, #10)",
                            ) || // WorkMissing
                            at.simulation.error.includes("Error(Contract, #14)")
                        ) // HarvestNotReady
                    )
                ) {
                    console.error("Harvest Error:", at.simulation.error);
                }
            } else {
                // @ts-ignore
                await server.send(at);

                localStorage.removeItem(`kale:${index}:plant`);
                localStorage.removeItem(`kale:${index}:work`);
                pails = localStorageToMap();

                await updateContractBalance($contractId);

                console.log("Successfully harvested", at.result);
            }
        } finally {
            harvesting = false;
        }
    }

    async function automate(
        e: Event & { currentTarget: EventTarget & HTMLInputElement },
    ) {
        const secret = sessionStorage.getItem(`kale:secret`);

        automated = e.currentTarget.checked;

        if ($keyId && automated && !secret) {
            try {
                automating = true;

                const keypair = Keypair.random();
                const secret = keypair.secret();
                const pubkey = keypair.publicKey();

                const limits: SignerLimits = new Map([
                    [import.meta.env.PUBLIC_KALE_CONTRACT_ID, []],
                ]);

                const { sequence } = await rpc.getLatestLedger();
                const at = await account.addEd25519(
                    pubkey,
                    limits,
                    SignerStore.Temporary,
                    sequence + 17280,
                );

                await account.sign(at, { keyId: $keyId });

                await server.send(at);

                sessionStorage.setItem(`kale:secret`, secret);
            } finally {
                automating = false;
            }
        }
    }

    async function transfer() {
        if (!$contractId || !$keyId) return;

        try {
            transferring = true

            const at = await kale.transfer({
                from: $contractId,
                to: send_address,
                amount: BigInt(Math.floor(Number(send_amount) * 1e7)),
            })

            await account.sign(at, { keyId: $keyId })

            await server.send(at)

            await updateContractBalance($contractId);

            send_amount = ''
        } finally {
            transferring = false
        }
    }

    function countdown(timestamp: bigint) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - Number(timestamp);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;

        return `${minutes}m ${seconds}s`;
    }
</script>

{#if $contractId}
<div class="flex flex-col">
    <label class="inline-block mb-2">
        <input
            type="checkbox"
            name="automate"
            id="automate"
            bind:checked={automated}
            on:change={(e) => automate(e)}
        />
        Automat{automating ? "ing..." : automated ? "ed" : "e"}
    </label>

    <label class="inline-flex items-center mb-2 tabular-nums">
        Stake %
        <input class="mx-2" type="range" name="stake" id="stake" min="0" max="100" bind:value={stake} />
        {stake}%
        <span class="text-sm ml-2 font-mono bg-green-700 text-yellow-100 px-3 py-1 rounded-full">{Number(((Number($contractBalance) || 0) * (stake / 100) / 1e7).toFixed(7))} KALE</span>
    </label>
</div>
{/if}

<div class="overflow-scroll">
    <table class="mb-5">
        <thead>
            <tr class="text-left [&>th]:px-2 [&>th]:border">
                <th>Block</th>
                <th>Entropy</th>
                <th>Blocktime</th>
                <th>Plant</th>
                <th>Work</th>
            </tr>
        </thead>
        <tbody>
            {#if block?.timestamp && BigInt(Math.floor(Date.now() / 1000) >= block.timestamp + BigInt(60 * 5))}
                <tr
                    class="[&>td]:px-2 [&>td]:py-1 [&>td]:border [&>td]:font-mono"
                >
                    <td colspan="3"></td>
                    <td colspan="2">
                        <button
                            class="bg-black text-white px-2 py-1 text-sm disabled:bg-gray-400"
                            on:click={() => plant(index + 1)}
                            disabled={planting}
                            >Plant{planting ? "ing..." : ""}</button
                        >
                    </td>
                </tr>
            {/if}

            {#each Array.from(blocks).sort(([index_a], [index_b]) => index_b - index_a) as [block_index, block], i}
                <tr
                    class="[&>td]:px-2 [&>td]:py-1 [&>td]:border [&>td]:font-mono"
                >
                    <td>
                        <div class="flex items-center">
                            {#if i === 0}
                                <span class="text-xs mr-2">🔴</span>
                            {/if}
                            {block_index}
                        </div>
                    </td>
                    <td>
                        {#if block}
                            {#if block.entropy}
                                {truncate(block.entropy.toString("hex"))}
                            {/if}
                        {/if}
                    </td>
                    <td>
                        {#if block}
                            {#if block.timestamp}
                                {countdown(block.timestamp)}
                            {/if}
                        {/if}
                    </td>
                    <td>
                        {#if i === 0}
                            <button
                                class="bg-black text-white px-2 py-1 text-sm disabled:bg-gray-400"
                                on:click={() => plant()}
                                disabled={planting ||
                                    pails.get(block_index)?.[0]}
                                >Plant{planting ? "ing..." : ""}</button
                            >
                        {:else}{/if}
                    </td>
                    <td>
                        {#if i === 0}
                            <button
                                class="bg-black text-white px-2 py-1 text-sm disabled:bg-gray-400"
                                on:click={work}
                                disabled={working ||
                                    !pails.get(block_index)?.[0] ||
                                    pails.get(block_index)?.[1]}
                                >Work{working ? "ing..." : ""}</button
                            >
                        {:else}{/if}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<table class="mb-5">
    <thead>
        <tr class="text-left [&>th]:px-2 [&>th]:border">
            <th>Block</th>
            <th>Harvest</th>
        </tr>
    </thead>
    <tbody>
        {#each Array.from(pails).sort(([index_a], [index_b]) => index_b - index_a) as [pail_index, [planted, worked]]}
            {#if worked}
                <tr
                    class="[&>td]:px-2 [&>td]:py-1 [&>td]:border [&>td]:font-mono"
                >
                    <td>
                        <div class="flex items-center">
                            {pail_index}
                        </div>
                    </td>
                    <td>
                        <button
                            class="bg-black text-white px-2 py-1 text-sm disabled:bg-gray-400"
                            on:click={() => harvest(pail_index)}
                            disabled={harvesting || pail_index === index}
                            >{pail_index === index
                                ? "Waiting..."
                                : `Harvest${harvesting ? "ing..." : ""}`}
                        </button>
                    </td>
                </tr>
            {/if}
        {/each}
    </tbody>
</table>

{#if $contractId}
    <form class="bg-gray-200 p-2 rounded flex flex-wrap items-center" on:submit|preventDefault={transfer}>
        <span class="w-full">Transfer KALE</span>
        <input
            class="mr-2 my-2 font-mono text-sm px-2 py-1 min-w-[300px]"
            type="text"
            name="address"
            id="address"
            placeholder="Address to send the KALE to"
            bind:value={send_address}
        />
        <input
            class="mr-2 my-2 font-mono text-sm px-2 py-1 max-w-[180px]"
            type="text"
            name="amount"
            id="amount"
            placeholder="Amount to send"
            bind:value={send_amount}
        />
        <button
            class="bg-black text-white px-2 py-1 text-sm font-mono disabled:bg-gray-400"
            type="submit"
            disabled={transferring}
            >Send{transferring ? 'ing...' : ''}</button
        >
    </form>
{/if}

<p class="mt-10">
    Learn more about <a
        class="underline text-blue-600"
        href="https://github.com/kalepail/KALE-sc"
        target="_blank">The KALEpail Project</a
    >
</p>
