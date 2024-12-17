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
</script>

<h1 class="text-xl font-bold mb-2">
    Leaderboard <span class="text-sm">({leaderboard.length})</span>
</h1>

<ul>
    {#each leaderboard as { balance_holder, balance_amount }, i}
        <li class="font-mono">
            {#if i < 3}
                {i === 0 ? '🥇' : ''}
                {i === 1 ? '🥈' : ''}
                {i === 2 ? '🥉' : ''}
            {:else}
                {i + 1}.
            {/if}
            <a
                class="underline"
                href={`https://stellar.expert/explorer/public/${balance_holder[0] === 'G' ? 'account' : 'contract'}/${balance_holder}`}
                target="_blank">{truncate(balance_holder, 7)}</a
            >
            : {balance_amount}
            
            {#if balance_holder === $contractId}
                {balance_holder === $contractId ? '🫵' : ''}
            {/if}
        </li>
    {/each}
</ul>
