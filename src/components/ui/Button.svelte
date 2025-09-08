<script lang="ts">
  import LoadingSpinner from '../LoadingSpinner.svelte';
  
  export let variant: "default" | "outline" | "ghost" | "destructive" = "default";
  export let size: "default" | "sm" | "lg" | "icon" = "default";
  export let className = "";
  export let disabled = false;
  export let loading = false;
  export let type = "button";
  
  let baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-green-500/50";
  
  let variantClasses = {
    default: "bg-green-600 text-white shadow-sm hover:bg-green-700",
    outline: "border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:text-gray-900",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700"
  };
  
  let sizeClasses = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md gap-1.5 px-3",
    lg: "h-10 rounded-md px-6",
    icon: "size-9"
  };
  
  $: classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  $: isDisabled = disabled || loading;
</script>

<button {type} disabled={isDisabled} class={classes} on:click>
  {#if loading}
    <LoadingSpinner size="sm" />
  {/if}
  <slot />
</button>
