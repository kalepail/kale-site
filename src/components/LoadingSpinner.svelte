<script lang="ts">
  export let size: "sm" | "md" | "lg" = "md";
  export let className = "";
  
  $: sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };
</script>

<div class="flex items-center justify-center {className}">
  <div class="animate-spin rounded-full border-2 border-gray-300 border-t-green-600 {sizeClasses[size]}"></div>
</div>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
