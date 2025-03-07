<script lang="ts">
    import { onMount } from "svelte";
    import { truncate } from "../utils/base";
    import { contractId } from "../store/contractId";

    let leaderboard: {
        balance_holder: string;
        balance_amount: string;
    }[] = [];

    onMount(() => {
        getLeaderboard();
    });

    async function getLeaderboard() {
        leaderboard = await fetch(
            "https://kale-worker.sdf-ecosystem.workers.dev/leaderboard",
        ).then((res) => {
            if (res.ok) return res.json();
            else throw new Error("Failed to fetch leaderboard");
        });
    }

    function sanitizeAmount(amount: string) {
        const num = Number(amount);
        // Format with 2 decimal places
        const formatted = num.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
        // Add padding to align numbers (100M would be 9 digits + commas + decimals)
        // Example: "100,000,000.00" is 14 characters
        return formatted.padStart(14, '_');
    }
</script>

<h1 class="text-xl font-bold mb-2">
    Leaderboard <span class="text-sm">({leaderboard.length})</span>
</h1>

<ul class="text-sm sm:text-base">
    {#each leaderboard as { balance_holder, balance_amount }, i}
        <!-- {#if Number(balance_amount) > 0 && i < 100} -->
        <li class="font-mono odd:bg-slate-100 {i < 10 && 'font-bold py-1'} {i < 3 && 'py-2'} {i === 0 ? '!bg-amber-400/50' : i === 1 ? '!bg-slate-400/50' : i === 2 ? '!bg-yellow-800/50' : ''} {(i === 9 || i == 99) && 'border-b'}">
            {#if i === 0}
                &nbsp;🥇&nbsp;
            {:else if i == 1}
                &nbsp;🥈&nbsp;
            {:else if i == 2}
                &nbsp;🥉&nbsp;
            {:else if i < 9}
                &nbsp;&nbsp;{i + 1}.
            {:else if i < 99}
                &nbsp;{i + 1}.
            {:else}
                {i + 1}.
            {/if}
            <a
                class="underline"
                href={`https://stellar.expert/explorer/public/${balance_holder[0] === "G" ? "account" : "contract"}/${balance_holder}`}
                target="_blank">{truncate(balance_holder, 7)}</a
            >
            : { sanitizeAmount(balance_amount) }

            {#if balance_holder === $contractId}
                {balance_holder === $contractId ? "🫵" : ""}
            {/if}
        </li>
        <!-- {/if} -->
    {/each}
</ul>
