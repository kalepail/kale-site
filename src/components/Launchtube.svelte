<script lang="ts">
    import { AssembledTransaction, type AssembledTransactionOptions } from "@stellar/stellar-sdk/minimal/contract";
    import { contractId } from "../store/contractId";
    import { keyId } from "../store/keyId";
    import { account } from "../utils/passkey-kit";
    import { Networks, Operation, Transaction } from "@stellar/stellar-sdk/minimal";
    import { Api } from "@stellar/stellar-sdk/minimal/rpc";
    import copy from 'copy-to-clipboard';

    const KALE_TO_XLM_FACTOR = 25;
    const KALE_WORKER_URL = 'https://kale-worker.sdf-ecosystem.workers.dev';

    let amount = 100;
    let consent = false;
    let lt_jwt: string | null = sessionStorage.getItem("kale:jwt");

    // TODO support G-address and off-site signing (will require signed transaction pasting)

    async function handleSubmit(event: Event) {
        if (!$contractId || !$keyId) return;

        lt_jwt = null;

        const tx_token = await fetch(`${KALE_WORKER_URL}/token`, {
            method: 'POST',
            body: JSON.stringify({
                from: $contractId,
                amount,
                consent,
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.ok) return res.text();
            else {
                alert("Failed to get tx token");
                throw new Error("Failed to get tx token");
            }
        })

        const [, data] = tx_token.split(".");
        const { tx } = JSON.parse(atob(data))

        const tx_built = new Transaction(tx, Networks.PUBLIC);
        const op = tx_built.operations[0] as Operation.InvokeHostFunction;
        const as = await AssembledTransaction.buildWithOp(
            Operation.invokeHostFunction({ func: op.func }), 
            account.wallet!.options as AssembledTransactionOptions
        );

        if (!Api.isSimulationSuccess(as.simulation!)) {
            alert(`Simulation failed: ${as.simulation?.error}`);
            return;
        }

        const { built } = await account.sign(as, { keyId: $keyId });
        const tx_signed = built?.toXDR();

        lt_jwt = await fetch(`${KALE_WORKER_URL}/token`, {
            method: 'POST',
            body: JSON.stringify({
                tx: tx_signed,
                consent,
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tx_token}`
            }
        }).then((res) => {
            if (res.ok) return res.text();
            else {
                alert("Failed to get lt token");
                throw new Error("Failed to get lt token");
            }
        });

        if (lt_jwt) {
            sessionStorage.setItem("kale:jwt", lt_jwt);
        }

        console.log(lt_jwt);
    }
    function clampAmount() {
        if (amount < 10) amount = 10;
        if (amount > 1000) amount = 1000;
    }
    function copyToken() {
        if (lt_jwt) {
            copy(lt_jwt);
            alert("Launchtube token copied to clipboard");
        }
    }
</script>

<h1 class="text-xl font-bold mb-5">
    Get a Launchtube token
</h1>

<form class="flex flex-col items-start" on:submit|preventDefault={handleSubmit}>
    <label class="mb-2">
        Agree to
        <a href="https://launchtube.xyz/terms-and-conditions" class="underline text-blue-600" target="_blank" rel="nofollow">T&C</a>:
        <input type="checkbox" bind:checked={consent} required>
    </label>
    <div class="flex">
        <label class="flex flex-col">
            You get
            <div class="flex items-center border mr-2 font-mono text-sm">
                <input class="pl-2 py-1 bg-white" type="number" min="10" max="1000" bind:value={amount} on:change={clampAmount}>
                <span class="pr-2">XLM</span>
            </div>
            <aside class="text-xs">10 – 1000 XLM</aside>
        </label>
        
        <label class="flex flex-col">
            You sell
            <button class="flex items-center bg-green-700 text-white px-2 py-1 mr-2" type="submit">Sell <span class="bg-white text-green-700 font-mono text-xs ml-2 px-2 rounded-full">{(amount * KALE_TO_XLM_FACTOR).toLocaleString()} KALE</span></button>
        </label>
    </div>
</form>

<p class="text-xs mt-5">*Launchtube tokens will be valid for 6 months</p>

{#if lt_jwt}
    <pre class="whitespace-pre-wrap break-words text-sm max-w-[500px] mt-5"><code>{lt_jwt}</code></pre>
    <button class="text-white bg-black px-2 py-1 mt-2" on:click={copyToken}>Copy</button>
{/if}