<script lang="ts">
  export let show = false;
  export let message = "";
  export let type: "success" | "error" | "info" = "info";
  
  let timeoutId: NodeJS.Timeout;
  
  $: if (show) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      show = false;
    }, 3000);
  }
  
  function getTypeClasses() {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  }
  
  function getIcon() {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  }
</script>

{#if show}
  <div class="fixed top-5 right-5 z-50 animate-in slide-in-from-right">
    <div class="{getTypeClasses()} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
      <span class="text-lg">{getIcon()}</span>
      <span class="font-medium">{message}</span>
      <button 
        class="ml-auto text-white/80 hover:text-white text-xl"
        on:click={() => show = false}
      >
        ×
      </button>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-in-from-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-in {
    animation: slide-in-from-right 0.3s ease-out;
  }
</style>
