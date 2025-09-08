<script lang="ts">
  export let open = false;
  export let children;
</script>

{#if open}
  <div class="fixed inset-0 z-50">
    {@render children()}
  </div>
{/if}
