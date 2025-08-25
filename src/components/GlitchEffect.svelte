<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  let glitchActive = false;
  let glitchInterval: number;
  let glitchTimeout: number;
  
  function triggerGlitch() {
    glitchActive = true;
    setTimeout(() => {
      glitchActive = false;
    }, 150);
  }
  
  onMount(() => {
    // Random glitch effects
    glitchInterval = setInterval(() => {
      if (Math.random() > 0.95) {
        triggerGlitch();
      }
    }, 3000) as any;
    
    // Glitch on page load
    glitchTimeout = setTimeout(() => {
      triggerGlitch();
    }, 1000) as any;
  });
  
  onDestroy(() => {
    if (glitchInterval) clearInterval(glitchInterval);
    if (glitchTimeout) clearTimeout(glitchTimeout);
  });
</script>

<div class="glitch-container" class:active={glitchActive}>
  <div class="glitch-layer layer-1"></div>
  <div class="glitch-layer layer-2"></div>
  <div class="glitch-layer layer-3"></div>
</div>

<style>
  .glitch-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 999;
    opacity: 0;
    transition: opacity 0.1s;
  }
  
  .glitch-container.active {
    opacity: 1;
  }
  
  .glitch-layer {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(233, 69, 96, 0.03) 2px,
      rgba(233, 69, 96, 0.03) 4px
    );
    mix-blend-mode: screen;
  }
  
  .glitch-container.active .layer-1 {
    animation: glitch-1 0.15s linear;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(233, 69, 96, 0.05) 2px,
      rgba(233, 69, 96, 0.05) 4px
    );
  }
  
  .glitch-container.active .layer-2 {
    animation: glitch-2 0.15s linear;
    background: repeating-linear-gradient(
      180deg,
      transparent,
      transparent 3px,
      rgba(0, 255, 255, 0.05) 3px,
      rgba(0, 255, 255, 0.05) 6px
    );
  }
  
  .glitch-container.active .layer-3 {
    animation: glitch-3 0.15s linear;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.02) 50%,
      transparent 100%
    );
  }
  
  @keyframes glitch-1 {
    0%, 100% {
      transform: translateX(0);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
    20% {
      transform: translateX(-2px);
      clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
    }
    40% {
      transform: translateX(2px);
      clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
    }
    60% {
      transform: translateX(-1px);
      clip-path: polygon(0 20%, 100% 20%, 100% 80%, 0 80%);
    }
    80% {
      transform: translateX(1px);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
  }
  
  @keyframes glitch-2 {
    0%, 100% {
      transform: translateY(0) scaleX(1);
      opacity: 1;
    }
    20% {
      transform: translateY(2px) scaleX(0.98);
      opacity: 0.8;
    }
    40% {
      transform: translateY(-2px) scaleX(1.02);
      opacity: 0.6;
    }
    60% {
      transform: translateY(1px) scaleX(0.99);
      opacity: 0.9;
    }
  }
  
  @keyframes glitch-3 {
    0%, 100% {
      filter: hue-rotate(0deg);
      transform: scale(1);
    }
    25% {
      filter: hue-rotate(90deg);
      transform: scale(1.01);
    }
    50% {
      filter: hue-rotate(-90deg);
      transform: scale(0.99);
    }
    75% {
      filter: hue-rotate(45deg);
      transform: scale(1.005);
    }
  }
</style>