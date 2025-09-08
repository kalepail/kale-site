<script lang="ts">
    import { onMount } from "svelte";
    import { truncate } from "../utils/base";
    import { contractId } from "../store/contractId";
    import Card from './ui/Card.svelte';

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
        return num.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }
</script>

<Card className="p-8">
    <div class="text-center">
        <div class="text-6xl mb-4">🏆</div>
        <h1 class="text-3xl font-bold text-green-700 mb-2">Leaderboard</h1>
        <p class="text-green-600 mb-8">Top community farmers ({leaderboard.length})</p>
        
        <div class="space-y-4 max-w-2xl mx-auto">
            {#each leaderboard as { balance_holder, balance_amount }, i}
                <div 
                    class="flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:shadow-md {
                        balance_holder === $contractId ? 'bg-green-100 border-2 border-green-300 shadow-md' : 
                        i < 3 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' : 
                        'bg-gray-50 border border-gray-200'
                    }"
                >
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">
                            {#if i === 0}
                                🥇
                            {:else if i === 1}
                                🥈
                            {:else if i === 2}
                                🥉
                            {:else}
                                #{i + 1}
                            {/if}
                        </span>
                        <div class="text-left">
                            <div class="font-bold text-gray-800">
                                {truncate(balance_holder, 7)}
                                {#if balance_holder === $contractId}
                                    <span class="ml-2 text-lg">🫵</span>
                                {/if}
                            </div>
                            <div class="text-sm text-gray-600">
                                <a
                                    class="underline hover:text-green-600"
                                    href={`https://stellar.expert/explorer/public/${balance_holder[0] === "G" ? "account" : "contract"}/${balance_holder}`}
                                    target="_blank"
                                >
                                    View on Stellar Expert
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-green-600 text-lg">
                            {sanitizeAmount(balance_amount)}
                        </div>
                        <div class="text-sm text-gray-500">KALE</div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</Card>
