<script lang="ts">
  let name = '';
  let email = '';
  let message = '';
  let submitted = false;
  let submitting = false;

  async function handleSubmit() {
    submitting = true;
    try {
      // Open mailto with pre-filled content as a reliable contact method
      const subject = encodeURIComponent(`Collaboration Request from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message || '(No message provided)'}`);
      window.open(`mailto:contact@starslab.app?subject=${subject}&body=${body}`, '_blank');
      submitted = true;
    } finally {
      submitting = false;
    }
  }
</script>

<section id="contact" class="section py-28">
  <div
    class="relative overflow-hidden rounded-3xl px-10 py-20 bg-gradient-to-br from-brand-gradientFrom/30 to-brand-gradientTo/20 border border-white/10"
  >
    <div class="max-w-3xl space-y-6 relative z-10">
      <h2 class="text-3xl md:text-5xl font-bold leading-tight">
        Collaborate With StarsLab
      </h2>
      <p class="text-lg text-white/80">
        Seeking partners in decentralized infra, embodied intelligence, and
        real‑time autonomy. Let's co‑create standards for a convergent,
        trustworthy future.
      </p>

      {#if submitted}
        <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
          <p class="text-green-400 font-semibold text-lg mb-2">Thanks, {name}!</p>
          <p class="text-white/70">Your email client should have opened. If not, reach us directly at
            <a href="mailto:contact@starslab.app" class="text-brand-accent hover:underline">contact@starslab.app</a>
          </p>
          <button
            on:click={() => { submitted = false; name = ''; email = ''; message = ''; }}
            class="mt-4 text-sm text-white/50 hover:text-white/80 transition"
          >
            Send another
          </button>
        </div>
      {:else}
        <form
          class="grid md:grid-cols-3 gap-4"
          on:submit|preventDefault={handleSubmit}
        >
          <input
            required
            bind:value={name}
            placeholder="Name"
            class="bg-black/30 border border-white/15 rounded-lg px-4 py-3 outline-none focus:border-brand-accent"
          />
          <input
            required
            type="email"
            bind:value={email}
            placeholder="Email"
            class="bg-black/30 border border-white/15 rounded-lg px-4 py-3 outline-none focus:border-brand-accent"
          />
          <button
            type="submit"
            disabled={submitting}
            class="bg-brand-accent hover:brightness-110 rounded-lg font-medium px-6 py-3 transition disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Request Access'}
          </button>
          <textarea
            bind:value={message}
            class="md:col-span-3 bg-black/30 border border-white/15 rounded-lg px-4 py-3 outline-none focus:border-brand-accent min-h-[120px]"
            placeholder="Your focus / collaboration idea (optional)"
          ></textarea>
        </form>
      {/if}
    </div>
    <div
      class="absolute -right-10 -top-10 w-80 h-80 blur-3xl opacity-40 bg-[conic-gradient(from_45deg,#E94560,#00FFFF,#E94560)] animate-pulse"
    ></div>
  </div>
</section>
