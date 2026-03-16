<script lang="ts">
  let email = '';
  let subscribed = false;

  function handleSubscribe() {
    if (!email) return;
    // Open mailto as lightweight contact method
    window.open(`mailto:contact@starslab.app?subject=${encodeURIComponent('Subscribe: ' + email)}&body=${encodeURIComponent('Please add me to research updates.\n\nEmail: ' + email)}`, '_blank');
    subscribed = true;
  }
</script>

<footer class="section pt-10 pb-16">
  <div class="grid md:grid-cols-4 gap-10 border-t border-white/10 pt-10">
    <div class="space-y-4">
      <h3 class="text-xl font-semibold gradient-text">StarsLab</h3>
      <p class="text-sm text-white/60 leading-relaxed">
        Independent deep research lab unifying blockchain trust layers, adaptive
        intelligence, and humanoid systems.
      </p>
    </div>
    <div>
      <h4 class="font-semibold mb-4">Focus</h4>
      <ul class="space-y-2 text-sm text-white/60">
        <li>Threshold Cryptography</li>
        <li>Autonomous Agents</li>
        <li>Embodied Control</li>
        <li>Edge Coordination</li>
      </ul>
    </div>
    <div>
      <h4 class="font-semibold mb-4">Resources</h4>
      <ul class="space-y-2 text-sm text-white/60">
        <li><a class="hover:text-brand-accent" href="https://github.com/stars-labs" target="_blank" rel="noopener noreferrer">Repositories</a></li>
        <li><span class="text-white/30">Whitepapers — Coming Soon</span></li>
        <li><span class="text-white/30">Standards — Coming Soon</span></li>
        <li><span class="text-white/30">Blog — Coming Soon</span></li>
      </ul>
    </div>
    <div class="space-y-4">
      <h4 class="font-semibold">Stay Updated</h4>
      {#if subscribed}
        <p class="text-sm text-green-400">Thanks! Check your email client.</p>
      {:else}
        <form class="flex gap-2" on:submit|preventDefault={handleSubscribe}>
          <input
            type="email"
            required
            bind:value={email}
            placeholder="Email"
            class="flex-1 bg-black/30 border border-white/15 rounded-lg px-4 py-2 outline-none focus:border-brand-accent"
          />
          <button
            type="submit"
            class="px-4 py-2 rounded-lg bg-brand-accent text-sm font-medium hover:brightness-110"
          >Join</button>
        </form>
      {/if}
      <p class="text-[11px] text-white/40">
        By subscribing you agree to receive research updates.
      </p>
    </div>
  </div>
  <div class="mt-10 text-xs text-white/40 flex flex-wrap gap-4">
    <span>© {new Date().getFullYear()} StarsLab</span>
    <span>Privacy</span>
    <span>Terms</span>
    <span>Security</span>
  </div>
</footer>
