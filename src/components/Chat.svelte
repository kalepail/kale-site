<script lang="ts">
    import { Address, scValToNative, xdr } from "@stellar/stellar-sdk";
    import { Server } from "@stellar/stellar-sdk/rpc";
    import { truncate } from "../utils/base";
    import { onDestroy, onMount } from "svelte";

    const rpc = new Server("https://soroban-testnet.stellar.org");

    interface Event {
        id: string;
        addr: string;
        timestamp: Date;
        index: number;
        txHash: string;
        msg: string;
    }

    let interval: NodeJS.Timeout;

    let msg: string = "";
    let msgs: Event[] = [];

    let sending: boolean = false;

    onMount(async () => {
        const { sequence } = await rpc.getLatestLedger();
        await getEvents(sequence - 17_280); // last 24 hrs

        interval = setInterval(async () => {
            console.log("fired");

            const { sequence } = await rpc.getLatestLedger();
            await getEvents(sequence - 17_280); // last 24 hrs
        }, 12_000); // 5 times per minute
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    async function getEvents(limit: number | string, found: boolean = false) {
        await rpc
            ._getEvents({
                filters: [
                    {
                        type: "contract",
                        contractIds: [
                            "CCASSTG4YEGVZCHHVTLFEX2PILGK6LO5K62Z7PAXB2R6RGUT63B3L66V",
                        ],
                    },
                ],
                // https://discord.com/channels/897514728459468821/1310801582887014411
                startLedger: typeof limit === "number" ? limit : undefined,
                limit: 10_000,
                cursor: typeof limit === "string" ? limit : undefined,
            })
            .then(
                async ({
                    events,
                    // @ts-ignore
                    cursor,
                }) => {
                    if (events.length === 0) {
                        if (found) return;
                        return getEvents(cursor);
                    }

                    events.forEach((event) => {
                        if (event.type !== "contract" || !event.contractId)
                            return;

                        if (
                            msgs.findIndex(({ id }) => id === event.id) === -1
                        ) {
                            let addr: string | undefined;
                            let topic0 = xdr.ScVal.fromXDR(
                                event.topic[0],
                                "base64",
                            ).address();
                            let topic1 = xdr.ScVal.fromXDR(
                                event.topic[1],
                                "base64",
                            );
                            let value = xdr.ScVal.fromXDR(
                                event.value,
                                "base64",
                            );

                            switch (topic0.switch().name) {
                                case "scAddressTypeAccount": {
                                    addr = Address.account(
                                        topic0.accountId().ed25519(),
                                    ).toString();
                                    break;
                                }
                                case "scAddressTypeContract": {
                                    addr = Address.contract(
                                        topic0.contractId(),
                                    ).toString();
                                    break;
                                }
                            }

                            msgs.push({
                                id: event.id,
                                addr,
                                timestamp: new Date(event.ledgerClosedAt),
                                index: scValToNative(topic1),
                                txHash: event.txHash,
                                msg: scValToNative(value),
                            });
                        }
                    });

                    return getEvents(cursor, true);
                },
            );

        msgs = msgs.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        );
    }

    function send() {}
</script>

<div class="flex flex-col min-w-full items-center pb-5">
    <div>
        <ul class="max-w-[350px]">
            {#each msgs as event}
                <li class="mb-2">
                    <span
                        class="text-mono text-sm bg-black rounded-t-lg text-white px-3 py-1"
                    >
                        {truncate(event.addr, 4)}
                        &nbsp; &nbsp;
                        <time
                            class="text-xs text-gray-400"
                            datetime={event.timestamp.toUTCString()}
                        >
                            {event.timestamp.toLocaleTimeString()}
                        </time>
                    </span>
                    <p
                        class="min-w-[220px] text-pretty break-words bg-gray-200 px-3 py-1 rounded-b-lg rounded-tr-lg border border-gray-400"
                    >
                        {event.msg}
                    </p>
                </li>
            {/each}
        </ul>

        <form class="flex flex-col mt-5" on:submit|preventDefault={send}>
            <textarea
                class="border px-3 py-1 mb-2 border-gray-400 rounded-lg"
                rows="4"
                name="msg"
                id="msg"
                placeholder="Type your message..."
                bind:value={msg}
            ></textarea>

            <div class="flex items-center ml-auto">
                <span class="text-gray-400 font-mono text-sm mr-2">
                    {(msg.length / 1e7).toFixed(7)} KALE
                </span>
                <button
                    class="bg-black text-white px-2 py-1 text-sm font-mono disabled:bg-gray-400"
                    type="submit"
                    disabled={sending}>Send{sending ? "ing..." : ""}</button
                >
            </div>
        </form>
    </div>
</div>
