<script lang="ts">
    import { onMount } from "svelte";
    import { truncate } from "../utils/base";

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
    Leaderboard
</h1>

<ul>
    {#each leaderboard as { balance_holder, balance_amount }, i}
        <li class="font-mono">
            {i + 1}.
            <a
                class="underline"
                href={`https://stellar.expert/explorer/public/${balance_holder[0] === 'G' ? 'account' : 'contract'}/${balance_holder}`}
                target="_blank">{truncate(balance_holder, 8)}</a
            >
            : {balance_amount}
        </li>
    {/each}
</ul>
