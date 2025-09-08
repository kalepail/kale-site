<script lang="ts">
  import Card from './ui/Card.svelte';
  import Button from './ui/Button.svelte';
  import Dialog from './ui/Dialog.svelte';
  import PercentageSlider from './PercentageSlider.svelte';
  
  export let blocks: Map<number, any>;
  export let pails: Map<number, [boolean, boolean, string | null, [number, number] | null, string | null]>;
  export let planting: boolean;
  export let working: boolean;
  export let onPlant: () => void;
  export let onWork: () => void;
  export let onHarvest: (index: number) => void;
  export let countdown: (timestamp: bigint) => string;
  export let contractBalance: number;
  export let stake: number;
  export let onStakeChange: (value: number) => void;
  export let isLoggedIn: boolean = false;
  export let harvestWithTractor: boolean = false;
  export let automated: boolean = false;
  export let automating: boolean = false;
  export let errors: number = 0;
  export let nextTractorRun: number | null = null;
  export let onAutomate: () => void;
  
  let showStakeModal = false;
  let showMusicPlayer = false;
  let stakePercentage = 25;
  let showLoginAlert = false;
  let showTractorAnimation = false;
  
  function getPlantEmoji(stage: number, ready: boolean) {
    if (ready) return "🌳";
    switch (stage) {
      case 1: return "🌱";
      case 2: return "🌿";
      case 3: return "🌳";
      default: return "🌱";
    }
  }
  
  function getProgress(block: any) {
    if (!block?.timestamp) return 0;
    const now = Math.floor(Date.now() / 1000);
    const diff = now - Number(block.timestamp);
    return Math.min((diff / 300) * 100, 100); // 5 minutes = 300 seconds
  }
  
  function getStage(block: any) {
    if (!block?.timestamp) return 0;
    const now = Math.floor(Date.now() / 1000);
    const diff = now - Number(block.timestamp);
    const progress = diff / 300; // 5 minutes
    
    if (progress < 0.33) return 1;
    if (progress < 0.66) return 2;
    if (progress < 1) return 3;
    return 4;
  }
  
  function openStakeModal() {
    if (!isLoggedIn) {
      return; // Not logged in
    }
    if (pails.get(Array.from(blocks.keys())[0])?.[0]) {
      return; // Already planted
    }
    showStakeModal = true;
  }
  
  function confirmStake() {
    onStakeChange(stakePercentage);
    onPlant();
    showStakeModal = false;
  }
  
  function handlePlotClick() {
    if (!isLoggedIn) {
      showLoginAlert = true;
      setTimeout(() => {
        showLoginAlert = false;
      }, 3000);
      return; // Not logged in - show alert
    }
    
    const currentBlock = Array.from(blocks.keys())[0];
    const pail = pails.get(currentBlock);
    
    if (!pail?.[0]) {
      // Not planted - open stake modal
      openStakeModal();
    } else if (pail[0] && !pail[1]) {
      // Planted but not worked - work
      onWork();
    }
  }

  // Removed handleBlockPlant - planting is only done through the main FarmPlot

  function handleBlockWork(blockNumber: number) {
    if (!isLoggedIn) {
      showLoginAlert = true;
      setTimeout(() => {
        showLoginAlert = false;
      }, 3000);
      return;
    }
    
    // Only allow work on the current block
    const currentBlock = Array.from(blocks.keys())[0];
    if (blockNumber === currentBlock) {
      onWork();
    }
  }

  function handleBlockHarvest(blockNumber: number) {
    if (!isLoggedIn) {
      showLoginAlert = true;
      setTimeout(() => {
        showLoginAlert = false;
      }, 3000);
      return;
    }
    
    // Only allow harvest on the current block
    const currentBlock = Array.from(blocks.keys())[0];
    if (blockNumber === currentBlock) {
      onHarvest(blockNumber);
    }
  }

  // Function to show tractor animation (called externally)
  export function showTractor() {
    if (harvestWithTractor) {
      showTractorAnimation = true;
      setTimeout(() => {
        showTractorAnimation = false;
      }, 4000);
    }
  }
</script>

<Card className="p-4 sm:p-6 lg:p-8 bg-white/90 backdrop-blur">
  <div class="relative mb-6">
    <!-- Controls - Desktop: Fixed in top right, Mobile: Above content -->
    <div class="absolute top-0 right-0 hidden sm:flex flex-col gap-2 sm:gap-3">
      <label class="flex items-center gap-2 bg-white/80 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-green-200 shadow-sm">
        <input
          class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
          type="checkbox"
          name="automate"
          id="automate"
          bind:checked={automated}
          on:change={onAutomate}
        />
        <span class="text-xs sm:text-sm font-medium text-gray-700">
          🤖 {automating ? "Activating..." : automated ? "Auto" : "Manual"}
        </span>
      </label>
      
      {#if automated}
        <div class="bg-blue-50 p-2 rounded-lg border border-blue-200 text-xs">
          <div class="text-blue-700 font-medium">Next:</div>
          <div class="font-mono text-blue-800 text-xs">{nextTractorRun ? new Date(nextTractorRun * 1000).toLocaleTimeString() : 'Calculating...'}</div>
          <div class="text-blue-600">({errors} errors)</div>
        </div>
      {/if}
      
      <!-- Music Control -->
      <label class="flex items-center gap-2 bg-white/80 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-green-200 shadow-sm">
        <input
          class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
          type="checkbox"
          name="music"
          id="music"
          bind:checked={showMusicPlayer}
        />
        <span class="text-xs sm:text-sm font-medium text-gray-700">
          🎵 Music
        </span>
      </label>
      
      {#if showMusicPlayer}
        <div class="bg-green-50 p-2 rounded-lg border border-green-200">
          <audio controls class="w-full" preload="auto" autoplay>
            <source src="./kale-farmer-song.mp3" type="audio/mpeg">
            <source src="/kale-farmer-song.mp3" type="audio/mpeg">
            <source src="https://kalepail.github.io/kale-site/kale-farmer-song.mp3" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        </div>
      {/if}
    </div>
    
    <!-- Mobile Controls - Above content -->
    <div class="flex sm:hidden justify-center gap-4 mb-4">
      <label class="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg border border-green-200 shadow-sm">
        <input
          class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
          type="checkbox"
          name="automate-mobile"
          id="automate-mobile"
          bind:checked={automated}
          on:change={onAutomate}
        />
        <span class="text-sm font-medium text-gray-700">
          🤖 {automating ? "Activating..." : automated ? "Auto" : "Manual"}
        </span>
      </label>
      
      <label class="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg border border-green-200 shadow-sm">
        <input
          class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
          type="checkbox"
          name="music-mobile"
          id="music-mobile"
          bind:checked={showMusicPlayer}
        />
        <span class="text-sm font-medium text-gray-700">
          🎵 Music
        </span>
      </label>
    </div>
    
    <!-- Mobile Music Player -->
    {#if showMusicPlayer}
      <div class="sm:hidden bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
        <audio controls class="w-full" preload="auto" autoplay>
          <source src="./kale-farmer-song.mp3" type="audio/mpeg">
          <source src="/kale-farmer-song.mp3" type="audio/mpeg">
          <source src="https://kalepail.github.io/kale-site/kale-farmer-song.mp3" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      </div>
    {/if}
    
    <!-- Mobile Automation Info -->
    {#if automated}
      <div class="sm:hidden bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4 text-center">
        <div class="text-blue-700 font-medium text-sm">Next:</div>
        <div class="font-mono text-blue-800 text-sm">{nextTractorRun ? new Date(nextTractorRun * 1000).toLocaleTimeString() : 'Calculating...'}</div>
        <div class="text-blue-600 text-sm">({errors} errors)</div>
      </div>
    {/if}
    
    <!-- Centered Content - Always centered -->
    <div class="text-center">
      <h2 class="text-xl sm:text-2xl font-bold text-green-700 mb-2">Your Farm</h2>
      <p class="text-sm sm:text-base text-green-600">Click on the land block to plant, work or harvest!</p>
      {#if !pails.get(Array.from(blocks.keys())[0])?.[0]}
        <div class="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
          Ready to plant
        </div>
      {/if}
    </div>
  </div>

  <!-- Login Alert -->
  {#if showLoginAlert}
    <div class="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
      <div class="flex items-center gap-2">
        <span class="text-xl">⚠️</span>
        <span class="font-semibold">Please login to interact with the farm!</span>
      </div>
    </div>
  {/if}

  <!-- Tractor Animation -->
  {#if showTractorAnimation}
    <div class="fixed inset-0 z-40 pointer-events-none">
      <div class="tractor-animation">
        <div class="tractor">
          <div class="tractor-body">🚜</div>
          <div class="tractor-wheels">
            <div class="wheel wheel-1">⚫</div>
            <div class="wheel wheel-2">⚫</div>
          </div>
        </div>
        <div class="tractor-trail"></div>
        <div class="tractor-dust"></div>
      </div>
    </div>
  {/if}

  <div class="flex justify-center">
    <div
      on:click={handlePlotClick}
      class="relative w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-br from-amber-800 to-amber-900 border-4 border-amber-900 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden {!pails.get(Array.from(blocks.keys())[0])?.[0] ? 'flex items-center justify-center' : ''}"
    >
      {#if !pails.get(Array.from(blocks.keys())[0])?.[0]}
        <div class="flex flex-col items-center justify-center text-center">
          <span class="text-6xl text-amber-700 opacity-60 mb-2">+</span>
          <span class="text-sm text-amber-800 font-medium">Click to plant</span>
        </div>
      {:else}
        {@const currentBlock = Array.from(blocks.keys())[0]}
        {@const pail = pails.get(currentBlock)}
        {@const block = blocks.get(currentBlock)}
        
        <!-- Token count -->
        {#if pail?.[2]}
          <div class="absolute top-2 left-2 sm:top-3 sm:left-3 bg-yellow-400 text-amber-900 px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-lg font-bold">
            {Number(Number(pail[2]) / 1e7).toFixed(0)}
          </div>
        {/if}

        <!-- Plant -->
        <div
          class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-4xl sm:text-6xl transition-all duration-500 {pail?.[1] ? 'animate-pulse filter drop-shadow-lg' : ''} {getStage(block) >= 3 ? 'animate-bounce' : ''}"
        >
          {getPlantEmoji(getStage(block), false)}
        </div>

        <!-- Timer -->
        {#if !pail?.[1] && block?.timestamp}
          <div class="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-lg font-bold">
            {countdown(block.timestamp)}
          </div>
        {/if}

        <!-- Progress bar -->
        {#if !pail?.[1]}
          <div
            class="absolute bottom-0 left-0 w-full h-3 bg-green-500/80 rounded-b-lg transition-all duration-300"
            style="width: {getProgress(block)}%"
          />
        {/if}
      {/if}
    </div>
  </div>

  <!-- Blocks Table -->
  <div class="mt-6 sm:mt-8">
    <h3 class="text-base sm:text-lg font-semibold text-green-700 mb-4 text-center">Planting History</h3>
    <div class="bg-white/50 backdrop-blur rounded-lg border border-green-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[600px]">
          <thead class="bg-green-100">
            <tr>
              <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-green-700">Lot</th>
              <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-green-700">Time</th>
              <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-green-700">Status</th>
              <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-green-700">Harvest</th>
              <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-green-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-green-200">
            {#each Array.from(blocks.entries()).slice(0, 10) as [blockNumber, block], index}
              {@const pail = pails.get(blockNumber)}
              {@const isCurrentBlock = index === 0}
              <tr class="hover:bg-green-50 transition-colors {isCurrentBlock ? 'bg-green-50' : ''}">
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-gray-700">
                  <div class="flex items-center gap-2">
                    {blockNumber}
                    {#if isCurrentBlock}
                      <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                    {/if}
                  </div>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                  {#if block?.timestamp}
                    {countdown(block.timestamp)}
                  {:else}
                    -
                  {/if}
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                  {#if pail?.[0] && pail?.[1]}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Ready to Harvest
                    </span>
                  {:else if pail?.[0] && !pail[1]}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Growing
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Empty Land
                    </span>
                  {/if}
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-gray-700">
                  {#if pail?.[2]}
                    {Number(Number(pail[2]) / 1e7).toFixed(0)} KALE
                  {:else}
                    -
                  {/if}
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                  <div class="flex gap-1 sm:gap-2">
                    {#if isCurrentBlock}
                      {#if pail?.[0] && !pail[1]}
                        <!-- Work button -->
                        <Button
                          on:click={() => handleBlockWork(blockNumber)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 text-xs"
                          disabled={working}
                        >
                          {working ? 'Working...' : 'Work'}
                        </Button>
                      {:else if pail[0] && pail[1]}
                        <!-- Harvest button -->
                        <Button
                          on:click={() => handleBlockHarvest(blockNumber)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
                        >
                          Harvest
                        </Button>
                      {:else}
                        <!-- Show message to use main FarmPlot for planting -->
                        <span class="text-gray-500 text-xs italic hidden sm:inline">Use the land lot above to plant</span>
                        <span class="text-gray-500 text-xs italic sm:hidden">Use land above</span>
                      {/if}
                    {:else}
                      <span class="text-gray-400 text-xs">-</span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</Card>

<!-- Stake Modal -->
<Dialog bind:open={showStakeModal}>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full">
      <div class="text-center mb-4 sm:mb-6">
        <h3 class="text-lg sm:text-xl font-bold text-green-700 mb-2">🥬 Stake KALE Tokens</h3>
      </div>
      
      <div class="space-y-4 sm:space-y-6">
        <!-- Balance Display -->
        <div class="text-center">
          <div class="text-sm text-gray-600 mb-2">Saldo Disponível</div>
          <div class="text-xl sm:text-2xl font-bold text-green-600">
            {Number(contractBalance / 1e7).toLocaleString()} KALE
          </div>
        </div>

        <!-- Percentage Slider -->
        <div class="space-y-4">
          <PercentageSlider
            value={stakePercentage}
            onChange={(value) => stakePercentage = value}
            label="Percentage for Stake"
            className="w-full"
          />
          
          <!-- Stake Amount Preview -->
          <div class="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
            <div class="flex justify-between items-center">
              <span class="text-xs sm:text-sm text-green-700">Stake Amount:</span>
              <span class="font-bold text-green-800 text-sm sm:text-base">
                {Math.floor((Number(contractBalance) / 1e7 * stakePercentage) / 100).toLocaleString()} KALE
              </span>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-xs sm:text-sm text-green-700">Retorno:</span>
              <span class="font-bold text-green-800 text-sm sm:text-base">
                {Math.floor((Number(contractBalance) / 1e7 * stakePercentage) / 100).toLocaleString()} KALE
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            on:click={() => showStakeModal = false}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            on:click={confirmStake}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={stakePercentage === 0}
          >
            Confirm Stake
          </Button>
        </div>
      </div>
    </div>
  </div>
</Dialog>

<style>
  .tractor-animation {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .tractor {
    position: absolute;
    top: 40%;
    left: -150px;
    font-size: 5rem;
    animation: tractorMove 4s linear;
    z-index: 41;
  }

  .tractor-body {
    position: relative;
    z-index: 2;
  }

  .tractor-wheels {
    position: absolute;
    bottom: -15px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    z-index: 1;
  }

  .wheel {
    font-size: 2.5rem;
    animation: wheelSpin 0.1s linear infinite;
  }

  .wheel-1 {
    margin-left: 15px;
  }

  .wheel-2 {
    margin-right: 15px;
  }

  .tractor-trail {
    position: absolute;
    top: 50%;
    left: -250px;
    width: 400px;
    height: 10px;
    background: linear-gradient(90deg, transparent, #4ade80, #22c55e, #16a34a, #15803d, transparent);
    border-radius: 5px;
    animation: tractorTrail 4s linear;
    z-index: 40;
  }

  .tractor-dust {
    position: absolute;
    top: 50%;
    left: -250px;
    width: 400px;
    height: 30px;
    background: radial-gradient(ellipse, rgba(139, 69, 19, 0.4) 0%, transparent 70%);
    animation: tractorDust 4s linear;
    z-index: 39;
  }

  @keyframes tractorMove {
    0% {
      left: -150px;
      transform: translateY(0);
    }
    100% {
      left: calc(100% + 150px);
      transform: translateY(0);
    }
  }

  @keyframes wheelSpin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes tractorTrail {
    0% {
      left: -400px;
      opacity: 0;
    }
    5% {
      opacity: 1;
    }
    95% {
      opacity: 1;
    }
    100% {
      left: calc(100% + 150px);
      opacity: 0;
    }
  }

  @keyframes tractorDust {
    0% {
      left: -400px;
      opacity: 0;
    }
    5% {
      opacity: 0.6;
    }
    95% {
      opacity: 0.6;
    }
    100% {
      left: calc(100% + 150px);
      opacity: 0;
    }
  }
</style>
