<script lang="ts">
    import { Address, scValToNative, xdr } from "@stellar/stellar-sdk";
    import { Server } from "@stellar/stellar-sdk/rpc";
    import { truncate } from "../utils/base";
    import { onDestroy, onMount } from "svelte";

    const rpc = new Server("https://soroban-testnet.stellar.org");

    interface Event {
        id: string,
        addr: string,
        timestamp: Date,
        index: number,
        txHash: string,
        msg: string,
    };

    let interval: NodeJS.Timeout;

    let msgs: Event[] = [];

    onMount(() => {
        getEvents();
        interval = setInterval(getEvents, 5000);
    })

    onDestroy(() => {
        if (interval) clearInterval(interval);
    })

    async function getEvents() {
        const { sequence } = await rpc.getLatestLedger();

        await rpc.getEvents({
            filters: [{
                type: "contract",
                contractIds: ["CBXJGGHTJUY23EBMWKHVCANBVBPSG2YLMAIFJ7PWAFBYWN32TKKKMEVH"]
            }],
            startLedger: sequence - 10_000,
            limit: 10000,
        }).then(({ events }) => {
            events.forEach((event) => {
                if (
                    event.type !== "contract"
                    || !event.contractId
                ) return;

                // console.log(event);

                if (msgs.findIndex(({ id }) => id === event.id) === -1) {
                    let addr: string | undefined;

                    switch (event.topic[0].address().switch().name) {
                        case "scAddressTypeAccount": {
                            addr = Address.account(event.topic[0].address().accountId().ed25519()).toString();
                            break;
                        }
                        case "scAddressTypeContract": {
                            addr = Address.contract(event.topic[0].address().contractId()).toString();
                            break;
                        }
                    }

                    msgs.push({
                        id: event.id,
                        addr,
                        timestamp: new Date(event.ledgerClosedAt),
                        index: scValToNative(event.topic[1]),
                        txHash: event.txHash,
                        msg: scValToNative(event.value),
                    })
                }
            });
        }) as Event[];

        msgs = msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
</script>

<div class="flex flex-col min-w-full items-center">
    <ul class="max-w-[350px]">
        {#each msgs as event}
            <li class="mb-2">
                <span class="text-mono text-sm bg-black rounded-t-lg text-white px-3 py-1">
                    {truncate(event.addr, 4)}
                    &nbsp;
                    &nbsp;
                    <time class="text-xs text-gray-400" datetime={event.timestamp.toUTCString()}>
                        {event.timestamp.toLocaleTimeString()}
                    </time>
                </span>
                <p class="text-pretty break-words bg-gray-200 px-3 py-1 rounded-b-lg rounded-tr-lg border border-gray-400">{event.msg}</p>
            </li>
        {/each}
    </ul>
</div>
