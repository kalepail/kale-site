<script lang="ts">
    import {
        Address,
        scValToNative,
        xdr,
        Networks,
    } from "@stellar/stellar-sdk";
    import { truncate } from "../utils/base";
    import { onDestroy, onMount } from "svelte";
    import { Client } from "kale-chat-sdk";
    import { contractId } from "../store/contractId";
    import { account, server } from "../utils/passkey-kit";
    import { keyId } from "../store/keyId";
    import { rpc } from "../utils/kale";
    import { updateContractBalance } from "../store/contractBalance";

    const chatContractId =
        "CBLMESJRDFWQFP74WAXZGBXIMXS5ANIATUA6MUVZWZBR2347XRYYHKFU";
    const client = new Client({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        contractId: chatContractId,
        networkPassphrase: Networks.TESTNET,
    });

    interface Event {
        id: string;
        addr: string;
        timestamp: Date;
        txHash: string;
        msg: string;
    }

    let interval: NodeJS.Timeout;

    let msg: string = "";
    let msgs: Event[] = [];

    let sending: boolean = false;

    onMount(async () => {
        msgs = await getMsgs();

        const { sequence } = await rpc.getLatestLedger();
        await getEvents(sequence - 17_280); // last 24 hrs

        interval = setInterval(async () => {
            const { sequence } = await rpc.getLatestLedger();
            await getEvents(sequence - 17_280); // last 24 hrs
        }, 12_000); // 5 times per minute
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    async function getMsgs() {
        return fetch(
            "https://kale-worker.sdf-ecosystem.workers.dev/chat",
        ).then((res) => {
            if (res.ok) return res.json();
            else throw new Error("Failed to fetch msgs");
        });
    }

    async function getEvents(limit: number | string, found: boolean = false) {
        await rpc
            ._getEvents({
                filters: [
                    {
                        type: "contract",
                        contractIds: [chatContractId],
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
                        if (limit === cursor || found) return;
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

    async function send() {
        if (!$contractId || !$keyId) return;

        try {
            sending = true;

            let at = await client.send({
                addr: $contractId,
                msg,
            });

            // @ts-ignore
            at = await account.sign(at, { keyId: $keyId });

            // @ts-ignore
            await server.send(at);

            await updateContractBalance($contractId);

            msg = ''
        } finally {
            sending = false;
        }
    }
</script>

<div class="flex flex-col min-w-full items-center pb-5">
    <div>
        <ul class="max-w-[350px]">
            {#each msgs as event}
                <li class="mb-2">
                    <span
                        class="text-mono text-sm bg-black rounded-t-lg text-white px-3 py-1"
                    >
                        <a
                            class="underline"
                            target="_blank"
                            href="https://stellar.expert/explorer/public/tx/{event.txHash}"
                            >{truncate(event.addr, 4)}</a
                        >
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
