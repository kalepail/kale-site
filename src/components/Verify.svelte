<script lang="ts">
    import { truncate } from "../utils/base";
    import { contractId } from "../store/contractId";

    let code: string | undefined;
    let data: {
        address: string
        balance: string
        date: string
    } | undefined;

    $: {
        if (!code)
            data = undefined
    }

    async function onEncrypt() {
        code = undefined;
        code = await fetch(
            "https://kale-worker.sdf-ecosystem.workers.dev/verify",
            // "http://localhost:8787/verify",
            {
                method: 'POST',
                body: $contractId,
            }
        )
        .then((res) => {
            if (res.ok) return res.text();
            else {
                alert("Failed to verify");
                throw new Error("Failed to verify");
            }
        });
    }
    async function onDecrypt() {
        if (!code)
            return alert("Please enter a verification code");

        data = undefined;
        data = await fetch(
            `https://kale-worker.sdf-ecosystem.workers.dev/verify/${code}`,
            // `http://localhost:8787/verify/${code}`,
        ).then((res) => {
            if (res.ok) return res.json();
            else {
                alert("Failed to verify");
                throw new Error("Failed to verify");
            }
        }).then((res) => {
            res.balance = `${(Number(res.balance) / 1e7)} KALE`;
            res.date = new Date(res.date).toLocaleString();
            
            return res
        });
    }
</script>

<div class="flex items-center justify-center content-center min-h-dvh">
    <div class="flex flex-col bg-gray-200">
        <div class="mb-5 pt-2 pb-5 border-b border-gray-300 mx-2">
            <form class="flex items-center mb-2" on:submit|preventDefault={onEncrypt}>
                {#if $contractId}
                    <button class="flex items-center bg-green-700 text-white px-2 py-1 mr-2" type="submit">Verify <span class="bg-white text-green-700 font-mono text-xs ml-2 px-1 rounded-full">{truncate($contractId)}</span></button>
                {/if}

                {#if code}
                    <code class="font-mono text-xs">{code}</code>
                {/if}
            </form>
            <p class="text-xs">*In order to succesfully verify you must have farmed at least 1 KALE</p>
        </div>
    
        <div class="flex flex-col mb-5 px-2">
            <form class="flex mb-2" on:submit|preventDefault={onDecrypt}>
                <input class="border px-2 py-1 font-mono text-sm bg-white" type="text" placeholder="Verification code" bind:value={code} on:input={() => data = undefined}>
                <button class="bg-green-700 text-white px-2 py-1" type="submit">Confirm</button>
            </form>

            {#if !data}
                <p class="text-xs">*May take up to a minute to verify</p>
            {/if}
        </div>
    
        {#if data}
            <pre class="font-mono text-sm px-2 pb-2"><code>✅ Confirmed</code><br><code>{JSON.stringify(data, null, 2)}</code></pre>
        {/if}
    </div>
</div>