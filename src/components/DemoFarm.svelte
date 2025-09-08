<script lang="ts">
    import FarmPlot from './FarmPlot.svelte';
    import TransferKale from './TransferKale.svelte';
    import MusicPlayer from './MusicPlayer.svelte';
    import Notification from './Notification.svelte';
    import Card from './ui/Card.svelte';
    
    // Mock data - starting with empty farm
    let mockBlocks = new Map([
        [12345, { timestamp: BigInt(Math.floor(Date.now() / 1000)) }], // Current block
        [12344, { timestamp: BigInt(Math.floor(Date.now() / 1000) - 300) }], // 5 minutes ago
        [12343, { timestamp: BigInt(Math.floor(Date.now() / 1000) - 600) }], // 10 minutes ago
        [12342, { timestamp: BigInt(Math.floor(Date.now() / 1000) - 900) }], // 15 minutes ago
    ]);
    
    let mockPails = new Map([
        [12345, [false, false, null, null, null]], // Not planted - this is the current block
        [12344, [true, true, "50000000", [12, 1], "25000000"]], // Planted, worked, staked, zeros/gap, harvested
        [12343, [true, false, "75000000", null, null]], // Planted, not worked yet
        [12342, [false, false, null, null, null]], // Not planted
    ]);
    
    let mockContractBalance = 1000000000; // 100 KALE
    let planting = false;
    let working = false;
    let harvesting = false;
    let transferring = false;
    let stake = 25; // Default stake percentage
    let harvestWithTractor = true; // Enable tractor for demo
    let automated = false;
    let automating = false;
    let errors = 0;
    let nextTractorRun = null;
    let farmPlotRef;
    
    // Notification system
    let showNotification = false;
    let notificationMessage = "";
    let notificationType: "success" | "error" | "info" = "info";
    
    function countdown(timestamp: bigint) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - Number(timestamp);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        return `${minutes}m ${seconds}s`;
    }
    
    function showNotificationMessage(message: string, type: "success" | "error" | "info" = "info") {
        notificationMessage = message;
        notificationType = type;
        showNotification = true;
    }
    
    function mockPlant() {
        planting = true;
        const stakeAmount = Math.floor((mockContractBalance * stake) / 100);
        
        setTimeout(() => {
            planting = false;
            // Update the pail to show it's planted
            mockPails.set(12345, [true, false, stakeAmount.toString(), null, null]);
            mockPails = mockPails;
            mockContractBalance -= stakeAmount;
            showNotificationMessage(`Demo: Planted ${Number(stakeAmount / 1e7).toFixed(2)} KALE!`, "success");
        }, 2000);
    }
    
    function mockWork() {
        working = true;
        setTimeout(() => {
            working = false;
            // Update the pail to show it's worked
            const currentPail = mockPails.get(12345);
            if (currentPail) {
                mockPails.set(12345, [currentPail[0], true, currentPail[2], [15, 2], null]);
                mockPails = mockPails;
            }
            showNotificationMessage("Demo: Worked! Found 15 zeros! ⚡", "success");
        }, 2000);
    }
    
    function mockHarvest(index: number) {
        // Simulate harvest
        const pail = mockPails.get(index);
        if (pail && pail[0] && pail[1]) {
            // Mark as harvested
            mockPails.set(index, [pail[0], pail[1], pail[2], pail[3], "100000000"]); // 10 KALE harvested
            mockPails = mockPails;
            showNotificationMessage("Demo: Harvested 10 KALE! 🥬", "success");
        }
    }
    
    function handleStakeChange(value: number) {
        stake = value;
    }
    
    function mockHarvestWithTractor() {
        harvesting = true;
        
        // Show tractor animation
        if (farmPlotRef) {
            farmPlotRef.showTractor();
        }
        
        setTimeout(() => {
            harvesting = false;
            // Simulate harvesting all ready pails
            const readyPails = Array.from(mockPails.entries()).filter(([_, pail]) => pail[1] && !pail[4]);
            readyPails.forEach(([index, pail]) => {
                mockPails.set(index, [pail[0], pail[1], pail[2], pail[3], "100000000"]);
            });
            mockPails = mockPails;
            showNotificationMessage(`Demo: Tractor harvested ${readyPails.length} lots! 🚜`, "success");
        }, 3000);
    }
    
    function mockTransfer(recipient: string, amount: number) {
        transferring = true;
        setTimeout(() => {
            transferring = false;
            mockContractBalance -= amount;
            showNotificationMessage(`Demo: Transferred ${Number(amount / 1e7).toFixed(2)} KALE to ${recipient}! 💸`, "success");
        }, 2000);
    }
    
    function mockAutomate() {
        automating = true;
        setTimeout(() => {
            automated = !automated;
            automating = false;
            nextTractorRun = automated ? Math.floor(Date.now() / 1000) + 300 : null; // 5 minutes from now
            showNotificationMessage(`Demo: Automation ${automated ? 'enabled' : 'disabled'}! 🤖`, "info");
        }, 1000);
    }
</script>

<!-- Demo Header -->
    <Card className="p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <div class="text-center">
            <h1 class="text-2xl sm:text-3xl font-bold text-green-700 mb-2">KALE Farm Demo</h1>
            <p class="text-sm sm:text-base text-green-600">
                This is an interactive demonstration of the KALE farm. Try the features without needing to be logged in!
            </p>
        </div>
    </Card>

    <!-- Farm Plot Demo -->
    <FarmPlot 
        bind:this={farmPlotRef}
        blocks={mockBlocks}
        pails={mockPails}
        {planting}
        {working}
        onPlant={mockPlant}
        onWork={mockWork}
        onHarvest={mockHarvest}
        {countdown}
        contractBalance={mockContractBalance}
        {stake}
        onStakeChange={handleStakeChange}
        isLoggedIn={true}
        {harvestWithTractor}
        {automated}
        {automating}
        {errors}
        {nextTractorRun}
        onAutomate={mockAutomate}
    />

    <!-- Main Actions Section -->
    <div class="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
        <!-- Quick Actions -->
        <div class="bg-white/90 backdrop-blur border border-green-200 rounded-xl p-4 sm:p-6">
            <h2 class="text-lg sm:text-xl font-bold text-green-700 mb-4">Quick Actions</h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <!-- Harvest Settings -->
                <div class="space-y-3">
                    <label class="flex items-center gap-3">
                        <input
                            class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                            type="checkbox"
                            name="harvest_tractor"
                            id="harvest_tractor"
                            bind:checked={harvestWithTractor}
                        />
                        <span class="text-sm font-medium text-gray-700">Use Tractor for Harvest</span>
                    </label>
                    
                    {#if harvestWithTractor && automated && nextTractorRun}
                        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div class="text-sm text-blue-700">Next Automatic Execution:</div>
                            <div class="font-mono text-blue-800 text-sm sm:text-base">{new Date(nextTractorRun * 1000).toLocaleTimeString()}</div>
                        </div>
                    {/if}
                    
                    <button
                        class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 transition-colors text-sm sm:text-base"
                        disabled={harvesting}
                        on:click={mockHarvestWithTractor}
                    >
                        {harvesting ? "Harvesting..." : harvestWithTractor ? "Collect with Tractor" : "Collect"}
                    </button>
                </div>
                
                <!-- Transfer Section -->
                <div>
                    <h3 class="text-sm font-medium text-gray-700 mb-2">Transferir KALE</h3>
                    <TransferKale 
                        contractBalance={mockContractBalance}
                        {transferring}
                        onTransfer={mockTransfer}
                    />
                </div>
            </div>
        </div>
        
        <!-- Harvestable Pails -->
        {#if Array.from(mockPails).some(([_, pail]) => pail[1] && !pail[4])}
            <div class="bg-white/90 backdrop-blur border border-green-200 rounded-xl p-4 sm:p-6">
                <h3 class="text-base sm:text-lg font-semibold text-gray-700 mb-4">Ready to Harvest</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {#each Array.from(mockPails).sort(([index_a], [index_b]) => index_b - index_a) as [pail_index, [_planted, worked, _staked, _zeros_gap, harvested]] (pail_index)}
                        {#if worked && !harvested}
                            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <div class="font-mono text-sm font-bold">Lot {pail_index}</div>
                                        <div class="text-xs text-gray-600">Ready to harvest</div>
                                    </div>
                                    <button
                                        class="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm font-medium disabled:bg-gray-400 transition-colors w-full sm:w-auto"
                                        on:click={() => mockHarvest(pail_index)}
                                        disabled={harvesting}
                                    >
                                        {harvesting ? "Harvesting..." : "Harvest"}
                                    </button>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
        
    </div>

<!-- Notification Component -->
<Notification 
    bind:show={showNotification}
    message={notificationMessage}
    type={notificationType}
/>

