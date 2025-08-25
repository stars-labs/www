<script lang="ts">
  import { onMount } from 'svelte';
  
  let visible = false;
  
  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 100);
  });
</script>

<div class="tech-grid" class:visible>
  <div class="grid-lines">
    {#each Array(20) as _, i}
      <div class="line-h" style="top: {i * 5}%"></div>
    {/each}
    {#each Array(30) as _, i}
      <div class="line-v" style="left: {i * 3.33}%"></div>
    {/each}
  </div>
  
  <div class="scan-line"></div>
  
  <div class="corner-brackets">
    <div class="bracket tl"></div>
    <div class="bracket tr"></div>
    <div class="bracket bl"></div>
    <div class="bracket br"></div>
  </div>
</div>

<style>
  .tech-grid {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 2s ease-out;
  }
  
  .tech-grid.visible {
    opacity: 1;
  }
  
  .grid-lines {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  
  .line-h, .line-v {
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(233, 69, 96, 0.03), transparent);
    animation: pulse 8s ease-in-out infinite;
  }
  
  .line-h {
    width: 100%;
    height: 1px;
    left: 0;
  }
  
  .line-v {
    height: 100%;
    width: 1px;
    top: 0;
    background: linear-gradient(180deg, transparent, rgba(0, 255, 255, 0.03), transparent);
  }
  
  .scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent,
      rgba(0, 255, 255, 0.4),
      rgba(233, 69, 96, 0.4),
      transparent
    );
    animation: scan 6s linear infinite;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  }
  
  @keyframes scan {
    0% { transform: translateY(0); }
    100% { transform: translateY(100vh); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.8; }
  }
  
  .corner-brackets {
    position: absolute;
    inset: 20px;
  }
  
  .bracket {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 2px solid;
    opacity: 0.5;
    animation: bracket-glow 4s ease-in-out infinite;
  }
  
  .bracket.tl {
    top: 0;
    left: 0;
    border-right: none;
    border-bottom: none;
    border-color: #E94560;
  }
  
  .bracket.tr {
    top: 0;
    right: 0;
    border-left: none;
    border-bottom: none;
    border-color: #00FFFF;
  }
  
  .bracket.bl {
    bottom: 0;
    left: 0;
    border-right: none;
    border-top: none;
    border-color: #00FFFF;
  }
  
  .bracket.br {
    bottom: 0;
    right: 0;
    border-left: none;
    border-top: none;
    border-color: #E94560;
  }
  
  @keyframes bracket-glow {
    0%, 100% { 
      opacity: 0.3;
      transform: scale(1);
    }
    50% { 
      opacity: 0.8;
      transform: scale(1.02);
    }
  }
  
  @media (max-width: 768px) {
    .bracket {
      width: 20px;
      height: 20px;
    }
  }
</style>