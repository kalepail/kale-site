<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import {
        contract,
        getBlock,
        getContractData,
        getIndex,
        tractor,
        type Block,
        type Pail,
    } from "../utils/kale";
    import { doWork, loadWasm } from "../utils/wasm-miner";
    import { contractId } from "../store/contractId";
    import { countZeros, getPails, setBlocks, getBlocks, getRandomNumber, getMinuteOffsetFromSecretKey, getNextTractorTime, truncate } from "../utils/base";
    import { Address, Keypair } from "@stellar/stellar-sdk";
    import { Api } from "@stellar/stellar-sdk/rpc";
    import { account, kale, setLTHeaders, server } from "../utils/passkey-kit";
    import { keyId } from "../store/keyId";
    import {
        contractBalance,
        updateContractBalance,
    } from "../store/contractBalance";
    import { SignerStore, type SignerLimits } from "passkey-kit";
    import { turnstileToken } from "../store/turnstileToken";

    let interval: NodeJS.Timeout;

    let index: number;
    let block: Block | undefined;
    let pail: Pail | undefined;

    let blocks: Map<number, Block | undefined> = new Map(); // TODO save last 12 blocks to localstorage
    let pails: Map<
        number,
        [
            boolean, // planted
            boolean, // worked
            string | null, // staked
            [number, number] | null, // work [zeros, gap]
            string | null, // harvested
        ]
    > = new Map();

    let automated = false;
    let automating = false;
    let planting = false;
    let working = false;
    let harvesting = false;
    let transferring = false;
    let stake = 0;
    let errors = 0;

    let send_address: string;
    let send_amount: string;

    let harvest_with_tractor = true;
    let tractor_offset: number;
    let next_tractor_run: number;

    onMount(async () => {
        loadWasm();
        index = await getIndex();
        blocks = getBlocks(index);
        pails = getPails(index);
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    turnstileToken.subscribe((token) => {
        if (token) {
            setLTHeaders(token);
        }
    });

    contractId.subscribe(async (cid) => {
        if (!cid) return;

        const data = await getContractData(cid);

        index = data.index;
        block = data.block;
        pail = data.pail;

        blocks.set(index, block);
        blocks = blocks;
        setBlocks(blocks);

        if (interval) clearInterval(interval);

        interval = setInterval(
            () =>
                getIndex().then(async (next_index) => {
                    const secret = sessionStorage.getItem(`kale:secret`);
                    if (secret && (automated || automating) && harvest_with_tractor) {
                        tractor_offset = getMinuteOffsetFromSecretKey(secret);
                        next_tractor_run = getNextTractorTime(tractor_offset);
                    }

                    if (next_index > index) {
                        index = next_index;
                        block = await getBlock(index);
                        blocks.set(index, block);

                        // cap blocks to most recent 12
                        if (blocks.size > 12) {
                            const sortedKeys = Array.from(blocks.keys()).sort(
                                (a, b) => b - a,
                            );

                            for (let i = 12; i < sortedKeys.length; i++) {
                                blocks.delete(sortedKeys[i]);
                            }
                        }
                    }

                    blocks = blocks;
                    setBlocks(blocks);

                    if (secret && !automating && automated) {
                        try {
                            if (errors > 12) {
                                console.error("Too many errors");
                                automated = false;
                                errors = 0;
                                return;
                            }

                            automating = true;

                            let [planted, worked] = pails.get(next_index) ?? [
                                false,
                                false,
                            ];

                            const now = Math.floor(Date.now() / 1000);
                            const diff = now - Number(block?.timestamp);

                            if (!planted && !worked && diff >= getRandomNumber(0, 180) && diff <= 240) { // plant between 0 and 180 seconds but not after 240 seconds
                                await plant(index, Keypair.fromSecret(secret));
                            }

                            if (planted && !worked && diff >= getRandomNumber(180, 260)) { // begin working between 180 and 260 seconds
                                await work();
                            }

                            // wait 30 seconds into the block before beginning to harvest
                            if (diff < 30) {
                                return;
                            }

                            let harvestables = Array.from(
                                pails.entries(),
                            ).filter(
                                ([
                                    pailIndex,
                                    [
                                        planted,
                                        worked,
                                        staked,
                                        zeros_gap,
                                        harvested,
                                    ],
                                ]) => worked && !harvested && pailIndex < index,
                            );

                            if (harvest_with_tractor) {
                                if (harvestables.length && new Date(now * 1000).getMinutes() === tractor_offset) {
                                    await harvestWithTractor(harvestables
                                        .map(harvestable => harvestable[0])
                                    );

                                    next_tractor_run = getNextTractorTime(tractor_offset);
                                }
                            } else {
                                for (let harvestable of harvestables) {
                                    await harvest(harvestable[0]);
                                }
                            }

                            errors = 0;
                        } catch (err) {
                            console.error("Automation failed", err);
                            errors++;
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
            await updateContractBalance($contractId);

            let amount = BigInt(
                errors
                    ? 0 // If there are errors, don't stake
                    : Math.floor(
                          (Number($contractBalance) || 0) * (stake / 100),
                      ),
            );
            let at = await contract.plant({
                farmer: $contractId,
                amount,
            }, {
                timeoutInSeconds: 30,
            });

            if (Api.isSimulationError(at.simulation!)) {
                if (at.simulation.error.includes("Error(Contract, #8)")) {
                    // PailExists
                    console.log("Already planted");
                    localStorage.setItem(`kale:${i ?? index}:plant`, "NaN");
                    pails = getPails();
                } else {
                    console.error("Plant Error:", at.simulation.error);
                    throw new Error(at.simulation.error);
                }

                return;
            }

            // @ts-ignore
            at = await account.sign(
                // @ts-ignore
                at,
                keypair ? { keypair } : { keyId: $keyId },
            );

            // @ts-ignore
            await server.send(at);

            console.log("Successfully planted", amount);
            localStorage.setItem(`kale:${i ?? index}:plant`, amount.toString());
            pails = getPails();

            await updateContractBalance($contractId);
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
            }>((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const work = doWork(
                            index,
                            Uint8Array.from(block!.entropy!),
                            Uint8Array.from(
                                Address.fromString($contractId).toBuffer(),
                            ),
                        );

                        resolve(work);
                    } catch (err) {
                        reject(err);
                    }
                }, 10);
            });

            const at = await contract.work({
                farmer: $contractId,
                hash: Buffer.from(local_hash),
                nonce: max_nonce,
            }, {
                timeoutInSeconds: 30,
            });

            if (Api.isSimulationError(at.simulation!)) {
                if (at.simulation.error.includes("Error(Contract, #7)")) {
                    // ZeroCountTooLow
                    console.log("Already worked");
                    localStorage.setItem(`kale:${index}:work`, `["NaN","NaN"]`);
                    pails = getPails();
                } else {
                    console.error("Work Error:", at.simulation.error);
                    throw new Error(at.simulation.error);
                }

                return;
            }

            // @ts-ignore
            await server.send(at);

            console.log("Successfully worked", at.result);
            localStorage.setItem(
                `kale:${index}:work`,
                `[${countZeros(local_hash)},${at.result}]`,
            );
            pails = getPails();
        } finally {
            working = false;
        }
    }

    async function harvest(index: number) {
        if (!$contractId) return;

        try {
            harvesting = true;

            const at = await contract.harvest({
                farmer: $contractId,
                index,
            }, {
                timeoutInSeconds: 30,
            });

            if (Api.isSimulationError(at.simulation!)) {
                // NOTE don't throw on harvest errors
                if (at.simulation.error.includes("Error(Contract, #14)")) {
                    // HarvestNotReady
                    console.log("Harvest not ready");
                } else if (
                    at.simulation.error.includes("Error(Contract, #9)")
                ) {
                    console.log("Already harvested");
                    localStorage.setItem(`kale:${index}:harvest`, "NaN");
                    pails = getPails();
                } else {
                    // All other errors
                    console.error("Harvest Error:", at.simulation.error);
                }

                return;
            }

            // @ts-ignore
            await server.send(at);

            console.log("Successfully harvested", at.result);
            localStorage.setItem(`kale:${index}:harvest`, at.result.toString());
            pails = getPails(index);

            await updateContractBalance($contractId);

            console.log(await getBlock(index));
        } finally {
            harvesting = false;
        }
    }

    async function harvestWithTractor(indexes?: number[]) {
        if (!$contractId) return;

        if (!indexes || !indexes.length) {
            indexes = Array.from(
                pails.entries(),
            ).filter(
                ([
                    pailIndex,
                    [
                        planted,
                        worked,
                        staked,
                        zeros_gap,
                        harvested,
                    ],
                ]) => worked && !harvested && pailIndex < index,
            ).map(p => p[0]);
        }

        if (!indexes.length) return;

        try {
            harvesting = true;

            const at = await tractor.harvest({
                farmer: $contractId,
                pails: indexes,
            }, {
                timeoutInSeconds: 30,
            });

            if (Api.isSimulationError(at.simulation!)) {
                if (
                    at.simulation.error.includes("Error(Contract, #1)")
                ) {
                    console.log('No blocks requested for harvest')
                } else if (
                    at.simulation.error.includes("Error(Contract, #2)")
                ) {
                    console.log('No rewards for these blocks')

                    for (let index of indexes) {
                        localStorage.setItem(`kale:${index}:harvest`, "0");
                    }
                } else {
                    // All other errors
                    console.error("Harvest Error:", at.simulation.error);
                }

                return;
            }

            // @ts-ignore
            await server.send(at);

            console.log("Successfully harvested", at.result.reduce((acc, r) => acc += r, BigInt(0)));
            console.log('result', at.result)
            for (let i = 0; i < indexes.length; i++) {
                localStorage.setItem(`kale:${indexes[i]}:harvest`, at.result[i].toString());
            }

            pails = getPails(indexes[indexes.length - 1]);

            await updateContractBalance($contractId);

            console.log(await getBlock(indexes[indexes.length - 1]));
        } finally {
            harvesting = false;
        }
    }

    async function automate() {
        const secret = sessionStorage.getItem(`kale:secret`);
        if (secret) {
            tractor_offset = getMinuteOffsetFromSecretKey(secret);
            next_tractor_run = getNextTractorTime(tractor_offset);
        }

        if ($keyId && automated && !secret) {
            try {
                automating = true;

                const keypair = Keypair.random();
                const secret = keypair.secret();
                const pubkey = keypair.publicKey();

                const limits: SignerLimits = new Map(
                    import.meta.env.MODE === "production"
                        ? [
                              // production requires the inverse order from development
                              [import.meta.env.PUBLIC_KALE_SAC_ID, undefined], // TODO would be nice to enforce this context via a policy signer so we could only call this context as a sub invocation of the `PUBLIC_KALE_CONTRACT_ID`
                              [
                                  import.meta.env.PUBLIC_KALE_CONTRACT_ID,
                                  undefined,
                              ],
                          ]
                        : [
                              [
                                  import.meta.env.PUBLIC_KALE_CONTRACT_ID,
                                  undefined,
                              ],
                              [import.meta.env.PUBLIC_KALE_SAC_ID, undefined],
                          ],
                );

                const at = await account.addEd25519(
                    pubkey,
                    limits,
                    SignerStore.Temporary,
                );

                await account.sign(at, { keyId: $keyId });

                await server.send(at);

                sessionStorage.setItem(`kale:secret`, secret);

                tractor_offset = getMinuteOffsetFromSecretKey(secret);
                next_tractor_run = getNextTractorTime(tractor_offset);
            } catch {
                automated = false;
            } finally {
                automating = false;
            }
        }
    }

    async function transfer() {
        if (!$contractId || !$keyId) return;

        try {
            transferring = true;

            const at = await kale.transfer({
                from: $contractId,
                to: send_address,
                amount: BigInt(Math.floor(Number(send_amount) * 1e7)),
            });

            await account.sign(at, { keyId: $keyId });

            await server.send(at);

            await updateContractBalance($contractId);

            send_amount = "";
        } finally {
            transferring = false;
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
    <div class="flex flex-col items-start">
        <label class="inline-flex items-baseline mb-2">
            <input
                class="mr-1"
                type="checkbox"
                name="automate"
                id="automate"
                bind:checked={automated}
                on:change={automate}
            />
            Automat{automating ? "ing..." : automated ? "ed" : "e"}
            <aside class="ml-1 text-xs font-mono">({errors} Errors)</aside>
        </label>

        <label class="inline-flex items-center mb-2 tabular-nums">
            <aside on:click={() => (stake = Math.max(stake - 1, 0))}>
                Stake %
            </aside>
            <input
                class="mx-2"
                type="range"
                name="stake"
                id="stake"
                min="0"
                max="100"
                bind:value={stake}
            />
            <aside on:click={() => (stake = Math.min(stake + 1, 100))}>
                {stake}%
            </aside>
            <span
                class="text-sm ml-2 font-mono bg-green-700 text-white px-3 py-1 rounded-full"
                >{Number(
                    (
                        ((Number($contractBalance) || 0) * (stake / 100)) /
                        1e7
                    ).toFixed(7),
                )} KALE</span
            >
        </label>
    </div>
{/if}

<div class="overflow-scroll">
    <table class="mb-5">
        <thead>
            <tr
                class="text-left [&>th]:px-2 [&>th]:border [&>th]:border-gray-200"
            >
                <th>Block</th>
                <th>Timer</th>
                <th>Plant</th>
                <th>Work</th>
                <th>Harvest</th>
            </tr>
        </thead>
        <tbody class="[&>tr>td]:whitespace-nowrap">
            <!-- Preemptive Plant -->
            {#if block?.timestamp && BigInt(Math.floor(Date.now() / 1000) >= block.timestamp + BigInt(60 * 5))}
                <tr
                    class="[&>td]:px-2 [&>td]:py-1 [&>td]:border [&>td]:font-mono [&>td]:border-gray-200"
                >
                    <td colspan="2"></td>
                    <td>
                        <button
                            class="bg-black text-white px-2 py-1 text-sm disabled:bg-gray-400"
                            on:click={() => plant(index + 1)}
                            disabled={planting}
                            >Plant{planting ? "ing..." : ""}</button
                        >
                    </td>
                    <td colspan="2"></td>
                </tr>
            {/if}

            <!-- Normal Plant -->
            {#each Array.from(blocks).sort(([index_a], [index_b]) => index_b - index_a) as [block_index, block], i (block_index)}
                <tr
                    class="[&>td]:px-2 [&>td]:py-1 [&>td]:border [&>td]:font-mono [&>td]:border-gray-200"
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
                            >
                                Plant{planting ? "ing..." : ""}
                            </button>
                        {/if}
                        {#if pails.get(block_index)?.[2]}
                            <aside
                                class="text-xs border px-2 py-1 rounded-full {i ===
                                    0 && 'mt-1'}"
                            >
                                {Number(
                                    (
                                        Number(pails.get(block_index)?.[2]) /
                                        1e7
                                    ).toFixed(7),
                                )} Stake
                            </aside>
                        {/if}
                    </td>
                    <td>
                        {#if i === 0}
                            <button
                                class="bg-black text-white px-2 py-1 text-sm disabled:bg-gray-400"
                                on:click={work}
                                disabled={working ||
                                    !pails.get(block_index)?.[0] ||
                                    pails.get(block_index)?.[1]}
                            >
                                Work{working ? "ing..." : ""}
                            </button>
                        {/if}
                        {#if pails.get(block_index)?.[3]}
                            <aside
                                class="text-xs border px-2 py-1 rounded-full {i ===
                                    0 && 'mt-1'}"
                            >
                                {pails.get(block_index)?.[3]?.[0]} Zeros,
                                {pails.get(block_index)?.[3]?.[1]} Gap
                            </aside>
                        {/if}
                    </td>
                    <td>
                        {#if i > 0 && pails.get(block_index)?.[4]}
                            <aside
                                class="text-xs bg-green-700 text-white px-2 py-1 rounded-full {i ===
                                    0 && 'mt-1'}"
                            >
                                {Number(
                                    (
                                        Number(pails.get(block_index)?.[4]) /
                                        1e7
                                    ).toFixed(7),
                                )} KALE
                            </aside>
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<div class="overflow-scroll">
    <div class="flex flex-col items-start mb-2">
        <div class="flex flex-row items-center mb-2">
            <label class="inline-flex items-baseline mr-2">
                <input
                    class="mr-1"
                    type="checkbox"
                    name="harvest_tractor"
                    id="harvest_tractor"
                    bind:checked={harvest_with_tractor}
                />
                Harvest with Tractor
            </label>
            <a
                class="font-mono text-sm underline"
                href="https://stellar.expert/explorer/public/contract/{tractor.options.contractId}"
                target="_blank">{truncate(tractor.options.contractId, 4)}</a
            >
        </div>
        {#if harvest_with_tractor}
            <div class="flex flex-row items-start mb-2">
                {#if automated && next_tractor_run}
                    <span
                        class="text-sm mr-2 font-mono bg-gray-400 text-white px-3 py-1 rounded-full"
                        >Next Auto-Run: {new Date(next_tractor_run * 1000).toLocaleTimeString()}</span
                    >
                {/if}
                <button
                    class="bg-black text-white px-2 py-1 text-sm disabled:bg-gray-400"
                    disabled={harvesting}
                    on:click={() => harvestWithTractor()}
                    >{harvesting ? "Harvesting...": "Run Tractor Now"}</button
                >
            </div>
        {/if}
    </div>

    <table class="mb-2">
        <thead>
            <tr class="text-left [&>th]:px-2 [&>th]:border [&>th]:border-gray-200">
                <th>Block</th>
                <th>Harvest</th>
            </tr>
        </thead>
        <tbody class="[&>tr>td]:whitespace-nowrap">
            {#each Array.from(pails).sort(([index_a], [index_b]) => index_b - index_a) as [pail_index, [_planted, worked, _staked, _zeros_gap, harvested]] (pail_index)}
                {#if worked && !harvested}
                    <tr
                        class="[&>td]:px-2 [&>td]:py-1 [&>td]:border [&>td]:font-mono [&>td]:border-gray-200"
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
    <div class="mb-5">
        <a
            class="font-mono text-sm underline"
            href="https://kalefail.elliotfriend.com/tractor"
            target="_blank">Check for missed Harvests</a
        >
    </div>
</div>

{#if $contractId}
    <form
        class="bg-gray-200 p-2 rounded flex flex-wrap items-center"
        on:submit|preventDefault={transfer}
    >
        <span class="w-full">Transfer KALE</span>
        <input
            class="mr-2 my-2 font-mono text-sm px-2 py-1 min-w-[300px] bg-white"
            type="text"
            name="address"
            id="address"
            placeholder="Address to send the KALE to"
            bind:value={send_address}
        />
        <input
            class="mr-2 my-2 font-mono text-sm px-2 py-1 max-w-[180px] bg-white"
            type="text"
            name="amount"
            id="amount"
            placeholder="Amount to send"
            bind:value={send_amount}
        />
        <button
            class="bg-black text-white px-2 py-1 text-sm font-mono disabled:bg-gray-400"
            type="submit"
            disabled={transferring}>Send{transferring ? "ing..." : ""}</button
        >
    </form>
{/if}

<aside class="text-xs mt-5 mb-1">Play (then mute if you want) to help keep this tab active</aside>
<audio class="mb-2" controls loop>
    <source
        type="audio/mpeg"
        src="kale-farmer-song.mp3"
    /> Your browser does not support the audio element.</audio
>

<p class="mt-10">
    Learn more about <a
        class="underline text-blue-600"
        href="https://github.com/kalepail/KALE-sc"
        target="_blank">The KALEpail Project</a
    >
</p>

<p class="mt-2">
    View the <a
        class="underline text-blue-600"
        href="https://github.com/kalepail/KALE-site"
        target="_blank">code for this site</a
    >
</p>

<p class="mt-2">
    <a
        class="underline text-blue-600"
        href="/upgrade">Upgrade your wallet</a
    >
</p>

<!-- <p class="mt-2">
    <a
        class="underline text-blue-600"
        href="/verify">Verify your account</a
    >
</p> -->

<p class="mt-2">
    <a
        class="underline text-blue-600"
        href="/launchtube">Buy a Launchtube token</a
    >
</p>
