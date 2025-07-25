<script lang="ts">
    import { onMount } from "svelte";
    
    let showAlert = false;
    
    onMount(() => {
        if (typeof window !== 'undefined') {
            const currentDomain = window.location.hostname;
            showAlert = currentDomain !== 'kalefarm.xyz';
        }
    });
</script>

{#if showAlert}
    <div class="bg-yellow-500 text-black px-4 py-3 text-center border-b border-yellow-600">
        <div class="flex items-center justify-center gap-2 flex-wrap">
            <span class="font-semibold">⚠️ Important Notice:</span>
            <span>Please migrate to <a href="https://kalefarm.xyz" class="underline font-bold">kalefarm.xyz</a> and transfer all your assets there for the best experience.</span>
        </div>
    </div>
{/if}