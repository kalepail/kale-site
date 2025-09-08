<script lang="ts">
  export let value = 0;
  export let onChange: (value: number) => void;
  export let label = "Percentage";
  export let className = "";
  
  let inputValue = value.toString();
  let sliderRef: HTMLDivElement;
  
  $: inputValue = value.toString();
  
  function handleSliderInteraction(clientX: number) {
    if (!sliderRef) return;
    
    const rect = sliderRef.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = Math.round(percentage * 100);
    
    onChange(newValue);
  }
  
  function handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;
  }
  
  function handleInputBlur() {
    const newValue = Number(inputValue);
    if (isNaN(newValue)) {
      inputValue = value.toString();
    } else {
      const clampedValue = Math.max(0, Math.min(100, Math.round(newValue)));
      inputValue = clampedValue.toString();
      onChange(clampedValue);
    }
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(100, value + 1);
      onChange(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(0, value - 1);
      onChange(newValue);
    }
  }
  
  function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    handleSliderInteraction(e.clientX);
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (e: MouseEvent) => {
      handleSliderInteraction(e.clientX);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp, { once: true });
  }
  
  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    handleSliderInteraction(e.touches[0].clientX);
    
    const handleTouchMove = (e: TouchEvent) => {
      handleSliderInteraction(e.touches[0].clientX);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleTouchMove);
    }, { once: true });
  }
</script>

<div class="flex flex-col gap-2 pb-4 {className}">
  <!-- Header with label and input -->
  <div class="flex justify-between items-center">
    <label class="text-sm font-medium text-gray-700">
      {label}
    </label>
    <div class="flex items-center bg-gray-100 rounded px-2 py-1">
      <input
        type="number"
        min="0"
        max="100"
        bind:value={inputValue}
        on:input={handleInputChange}
        on:blur={handleInputBlur}
        on:keydown={handleKeyDown}
        class="w-12 text-right text-sm bg-transparent border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span class="text-sm text-gray-500 ml-1">%</span>
    </div>
  </div>

  <!-- Slider -->
  <div class="relative h-6">
    <div 
      bind:this={sliderRef}
      class="absolute inset-0 cursor-pointer"
      on:mousedown={handleMouseDown}
      on:touchstart={handleTouchStart}
    >
      <!-- Track -->
      <div class="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <!-- Progress -->
        <div
          class="absolute top-0 h-full bg-blue-500 transition-all duration-150"
          style="width: {value}%"
        />
      </div>

      <!-- Thumb -->
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab active:cursor-grabbing transition-all duration-150 hover:scale-110"
        style="left: {value}%"
      />
    </div>
  </div>
</div>
