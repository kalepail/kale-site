<script lang="ts">
  import { explosions } from '../store/animations';
  
  let explosionElements: { [key: string]: HTMLElement } = {};
  
  function handleAnimationEnd(id: string) {
    explosions.update(current => current.filter(anim => anim.id !== id));
  }
</script>

{#each $explosions as explosion (explosion.id)}
  <div
    class="fixed pointer-events-none z-50"
    style="left: {explosion.x}px; top: {explosion.y}px;"
    on:animationend={() => handleAnimationEnd(explosion.id)}
  >
    <div class="explosion-container">
      {#each Array(12) as _, i}
        <div 
          class="explosion-emoji"
          style="--delay: {i * 0.1}s; --angle: {i * 30}deg;"
        >
          🥬
        </div>
      {/each}
    </div>
  </div>
{/each}

<style>
  .explosion-container {
    position: relative;
    width: 0;
    height: 0;
  }
  
  .explosion-emoji {
    position: absolute;
    font-size: 1.5rem;
    animation: explode 1.5s ease-out forwards;
    animation-delay: var(--delay);
    transform-origin: center;
    opacity: 0;
  }
  
  @keyframes explode {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotate(0deg) scale(1);
    }
    50% {
      opacity: 0.8;
      transform: translate(
        calc(cos(var(--angle)) * 100px), 
        calc(sin(var(--angle)) * 100px)
      ) rotate(180deg) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translate(
        calc(cos(var(--angle)) * 200px), 
        calc(sin(var(--angle)) * 200px)
      ) rotate(360deg) scale(0.5);
    }
  }
</style>
