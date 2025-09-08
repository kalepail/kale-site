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
    import { account, server, setLTHeaders } from "../utils/passkey-kit";
    import { keyId } from "../store/keyId";
    import { rpc } from "../utils/kale";
    import { updateContractBalance } from "../store/contractBalance";
    import { turnstileToken } from "../store/turnstileToken";

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
    let chatContainer: HTMLDivElement;

    onMount(async () => {
        await getMsgs();

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

    turnstileToken.subscribe((token) => {
        if (token) {
            setLTHeaders(token);
        }
    });

    async function getMsgs() {
        msgs = await fetch(
            "https://kale-worker.sdf-ecosystem.workers.dev/chat",
        ).then((res) => {
            if (res.ok) return res.json();
            else throw new Error("Failed to fetch msgs");
        }).then((msgs) => {
            return msgs.map((event: any) => {
                return {
                    ...event,
                    timestamp: new Date(event.timestamp),
                }
            })
        })

        msgs = msgs.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        );
        
        scrollToBottom();
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

    function scrollToBottom() {
        setTimeout(() => {
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
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

            msg = '';
            scrollToBottom();
        } finally {
            sending = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto">
    <!-- Chat Header -->
    <div class="bg-white/90 backdrop-blur border border-green-200 rounded-xl p-6 mb-6">
        <div class="text-center">
            <h1 class="text-3xl font-bold text-green-700 mb-2">KALE Community Chat</h1>
            <p class="text-green-600">Chat with other farmers and share your experiences!</p>
        </div>
    </div>

    <!-- Chat Container -->
    <div class="bg-white/90 backdrop-blur border border-green-200 rounded-xl overflow-hidden">
        <!-- Messages Area -->
        <div class="h-96 overflow-y-auto p-6 space-y-4" id="chat-messages" bind:this={chatContainer}>
            {#each msgs as event}
                <div class="flex {event.addr === $contractId ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-xs lg:max-w-md">
                        <div class="flex items-center gap-2 mb-1 {event.addr === $contractId ? 'justify-end' : 'justify-start'}">
                            <a
                                class="text-xs font-mono text-green-600 hover:text-green-800 underline"
                                target="_blank"
                                href="https://stellar.expert/explorer/public/tx/{event.txHash}"
                            >
                                {truncate(event.addr, 4)}
                            </a>
                            <time
                                class="text-xs text-gray-500"
                                datetime={event.timestamp.toUTCString()}
                            >
                                {event.timestamp.toLocaleTimeString()}
                            </time>
                        </div>
                        <div class="bg-gray-100 rounded-lg px-4 py-2 {event.addr === $contractId ? 'bg-green-100' : ''}">
                            <p class="text-sm text-gray-800 break-words">{event.msg}</p>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Message Input -->
        {#if $contractId}
            <div class="border-t border-green-200 p-4">
                <form on:submit|preventDefault={send} class="space-y-3">
                    <div>
                        <textarea
                            class="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            rows="3"
                            name="msg"
                            id="msg"
                            placeholder="Digite sua mensagem..."
                            bind:value={msg}
                            disabled={sending}
                        ></textarea>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-500">
                            <span class="font-mono">{(msg.length / 1e7).toFixed(7)} KALE</span>
                        </div>
                        
                        <button
                            class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400 transition-colors flex items-center gap-2"
                            type="submit"
                            disabled={sending || !msg.trim()}
                        >
                            {#if sending}
                                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Enviando...
                            {:else}
                                Enviar
                            {/if}
                        </button>
                    </div>
                </form>
            </div>
        {:else}
            <div class="border-t border-green-200 p-6 text-center">
                <div class="text-gray-500 mb-4">
                    <p class="text-lg font-medium">Please login to participate in the chat</p>
                    <p class="text-sm">Connect to chat with other farmers!</p>
                </div>
                <a 
                    href="/" 
                    class="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    Go to Login
                </a>
            </div>
        {/if}
    </div>
</div>
