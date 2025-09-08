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
    import { countZeros, getPails, setBlocks, getBlocks, getRandomNumber, getMinuteOffsetFromSecretKey, getNextTractorTime } from "../utils/base";
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
    import FarmPlot from "./FarmPlot.svelte";
    import TransferKale from "./TransferKale.svelte";
    import MusicPlayer from "./MusicPlayer.svelte";
    import Notification from "./Notification.svelte";

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
    
    // Notification system
    let showNotification = false;
    let notificationMessage = "";
    let notificationType: "success" | "error" | "info" = "info";
    let showAdvancedSettings = false;
    let farmPlotRef;

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
            showNotificationMessage(`Successfully planted ${Number(amount) / 1e7} KALE! `, "success");

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
            showNotificationMessage(`Successfully worked! ${countZeros(local_hash)} zeros found! ⚡`, "success");
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
            showNotificationMessage(`Successfully harvested ${Number(at.result) / 1e7} KALE! 🥬`, "success");

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
            
            // Show tractor animation
            if (farmPlotRef) {
                farmPlotRef.showTractor();
            }

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
            showNotificationMessage(`Successfully transferred ${send_amount} KALE! 🚀`, "success");

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
    
    function showNotificationMessage(message: string, type: "success" | "error" | "info" = "info") {
        notificationMessage = message;
        notificationType = type;
        showNotification = true;
    }
</script>

<!-- Advanced Settings Button -->
{#if $contractId}
    <div class="flex justify-center mb-6">
        <button
            class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            on:click={() => showAdvancedSettings = !showAdvancedSettings}
        >
            <span>⚙️</span>
            <span>{showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings</span>
        </button>
    </div>
{/if}

<!-- Advanced Settings Panel -->
{#if showAdvancedSettings && $contractId}
    <div class="bg-white/90 backdrop-blur border border-green-200 rounded-xl p-6 mb-6">
        <h2 class="text-xl font-bold text-green-700 mb-4">Advanced Settings</h2>
        
        <div class="space-y-4">
            <label class="flex items-center gap-3">
                <input
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    type="checkbox"
                    name="automate"
                    id="automate"
                    bind:checked={automated}
                    on:change={automate}
                />
                <span class="text-sm font-medium text-gray-700">
                    Automation {automating ? "Activating..." : automated ? "Active" : "Disabled"}
                </span>
                <span class="text-xs font-mono text-gray-500">({errors} Erros)</span>
            </label>
        </div>
    </div>
{/if}

<FarmPlot 
    bind:this={farmPlotRef}
    {blocks}
    {pails}
    {planting}
    {working}
    onPlant={() => plant()}
    onWork={work}
    onHarvest={harvest}
    {countdown}
    contractBalance={$contractBalance}
    {stake}
    onStakeChange={(value) => stake = value}
    isLoggedIn={!!$contractId}
    harvestWithTractor={harvest_with_tractor}
    {automated}
    {automating}
    {errors}
    nextTractorRun={next_tractor_run}
    onAutomate={automate}
/>

<!-- Main Actions Section -->
<div class="mt-8 space-y-6">
    <!-- Quick Actions -->
    <div class="bg-white/90 backdrop-blur border border-green-200 rounded-xl p-6">
        <h2 class="text-xl font-bold text-green-700 mb-4">Quick Actions</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Harvest Settings -->
            <div class="space-y-3">
                <label class="flex items-center gap-3">
                    <input
                        class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        type="checkbox"
                        name="harvest_tractor"
                        id="harvest_tractor"
                        bind:checked={harvest_with_tractor}
                    />
                    <span class="text-sm font-medium text-gray-700">Use Tractor for Harvest</span>
                </label>
                
                {#if harvest_with_tractor && automated && next_tractor_run}
                    <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div class="text-sm text-blue-700">Next Automatic Execution:</div>
                        <div class="font-mono text-blue-800">{new Date(next_tractor_run * 1000).toLocaleTimeString()}</div>
                    </div>
                {/if}
                
                <button
                    class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 transition-colors"
                    disabled={harvesting}
                    on:click={() => harvestWithTractor()}
                >
                    {harvesting ? "Harvesting..." : harvest_with_tractor ? "Collect with Tractor" : "Collect"}
                </button>
            </div>
            
            <!-- Transfer Section -->
            {#if $contractId}
                <div>
                    <h3 class="text-sm font-medium text-gray-700 mb-2">Transferir KALE</h3>
                    <TransferKale 
                        contractBalance={$contractBalance}
                        {transferring}
                        onTransfer={transfer}
                    />
                </div>
            {/if}
        </div>
    </div>
    
    <!-- Harvestable Pails -->
    {#if Array.from(pails).some(([_, pail]) => pail[1] && !pail[4])}
        <div class="bg-white/90 backdrop-blur border border-green-200 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Ready to Harvest</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {#each Array.from(pails).sort(([index_a], [index_b]) => index_b - index_a) as [pail_index, [_planted, worked, _staked, _zeros_gap, harvested]] (pail_index)}
                    {#if worked && !harvested}
                        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-mono text-sm font-bold">Lot {pail_index}</div>
                                    <div class="text-xs text-gray-600">Ready to harvest</div>
                                </div>
                                <button
                                    class="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm font-medium disabled:bg-gray-400 transition-colors"
                                    on:click={() => harvest(pail_index)}
                                    disabled={harvesting || pail_index === index}
                                >
                                    {pail_index === index ? "Waiting..." : harvesting ? "Harvesting..." : "Harvest"}
                                </button>
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
    
</div>

<!-- Notification Component -->
<Notification 
    bind:show={showNotification}
    message={notificationMessage}
    type={notificationType}
/>
