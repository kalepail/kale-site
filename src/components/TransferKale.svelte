<script lang="ts">
  import Card from './ui/Card.svelte';
  import Button from './ui/Button.svelte';
  import Input from './ui/Input.svelte';
  
  export let contractBalance: number;
  export let transferring: boolean;
  export let onTransfer: (address: string, amount: string) => void;
  
  let send_address = "";
  let send_amount = "";
  
  function handleTransfer() {
    if (!send_address || !send_amount) {
      return;
    }
    
    const amount = parseFloat(send_amount);
    if (amount <= 0 || amount > (contractBalance / 1e7)) {
      return;
    }
    
    onTransfer(send_address, send_amount);
    send_address = "";
    send_amount = "";
  }
</script>

<div class="space-y-2">
    <Input
      id="transfer-address"
      placeholder="Endereço de destino"
      bind:value={send_address}
      className="w-full text-xs sm:text-sm"
    />
    
    <div class="flex flex-col sm:flex-row gap-2">
      <Input
        id="transfer-amount"
        placeholder="Quantidade"
        type="number"
        bind:value={send_amount}
        className="flex-1 text-xs sm:text-sm"
      />
      <Button 
        on:click={handleTransfer}
        className="px-3 py-2 text-xs sm:text-sm w-full sm:w-auto"
        disabled={!send_address || !send_amount}
        loading={transferring}
      >
        Enviar
      </Button>
    </div>
    
    <div class="text-xs text-gray-500">
      Saldo: {Number(contractBalance ?? 0) / 1e7} KALE
    </div>
</div>
