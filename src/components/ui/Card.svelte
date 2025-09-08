<script lang="ts">
  export let className = "";
  export let children;
</script>

<div class="bg-white/90 backdrop-blur flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm {className}">
  {@render children()}
</div>
