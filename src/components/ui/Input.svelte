<script lang="ts">
  export let type = "text";
  export let placeholder = "";
  export let value = "";
  export let className = "";
  export let disabled = false;
  
  let baseClasses = "flex h-9 w-full min-w-0 rounded-md border border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500/50";
  
  $: classes = `${baseClasses} ${className}`;
</script>

<input {type} {placeholder} {value} {disabled} class={classes} on:input />
