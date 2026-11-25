<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { locale } from '../lib/i18n';
  import type { EncryptedBackupEnvelope } from '../lib/mpcSandbox';

  export let envelope: EncryptedBackupEnvelope;
  export let mode: 'encrypt' | 'decrypt-ok' | 'decrypt-fail' = 'encrypt';
  export let runKey = 0;

  let progress = 0;
  let playing = true;
  let lastRunKey = -1;
  let rafId = 0;
  let lastTs = 0;

  $: if (runKey !== lastRunKey) {
    lastRunKey = runKey;
    progress = 0;
    playing = true;
    lastTs = 0;
  }

  function tick(ts: number) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(80, ts - lastTs);
    lastTs = ts;
    if (playing) {
      progress += dt / 3600;
      if (progress >= 1) {
        progress = 1;
        playing = false;
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  onMount(() => {
    rafId = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });

  function replay() {
    progress = 0;
    playing = true;
    lastTs = 0;
  }

  $: kdfRoundsShown = Math.min(100000, Math.round(Math.min(1, progress / 0.45) * 100000));
  $: gcmPhase = Math.max(0, Math.min(1, (progress - 0.45) / 0.55));
  $: isFail = mode === 'decrypt-fail';
  $: isOk = mode === 'decrypt-ok';
  $: accent = isFail ? '#f87171' : isOk ? '#34d399' : '#22d3ee';
</script>

<div class="rounded-2xl border border-white/15 bg-[#090f1d] overflow-hidden">
  <div class="px-4 py-2.5 border-b border-white/10 bg-white/[0.025] flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full {isFail ? 'bg-red-400' : isOk ? 'bg-emerald-400' : 'bg-cyan-400'} {playing ? 'animate-ping' : ''}"></span>
      <span class="text-xs sm:text-sm font-bold text-white">
        {#if isFail}
          {$locale === 'zh' ? '🚫 AES-256-GCM 错密拦截动画 · GHASH 认证标签当场拒签' : '🚫 AES-256-GCM Rejection · GHASH Auth Tag Mismatch'}
        {:else if isOk}
          {$locale === 'zh' ? '🔓 AES-256-GCM 正确解密动画 · 认证标签匹配还原全部分片' : '🔓 AES-256-GCM Decryption · Auth Tag Verified'}
        {:else}
          {$locale === 'zh' ? '🔐 PBKDF2 (10万轮) + AES-256-GCM 加密封装流水线（真实字节）' : '🔐 PBKDF2 (100k) + AES-256-GCM Sealing Pipeline (Real Bytes)'}
        {/if}
      </span>
    </div>
    <button
      type="button"
      on:click={replay}
      class="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-[11px] font-mono text-white cursor-pointer"
    >
      🔄 {$locale === 'zh' ? '重播加密流程' : 'Replay'}
    </button>
  </div>

  <div class="px-3 py-3 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.08),rgba(9,15,29,0.98)_75%)]">
    <svg viewBox="0 0 880 230" class="w-full h-auto max-h-[245px] select-none" role="img" aria-label="PBKDF2 and AES-256-GCM pipeline">
      <!-- Stage 1: Password + Random 16B Salt -->
      <g transform="translate(115, 92)">
        <rect x="-92" y="-56" width="184" height="112" rx="14" fill="#111a30" stroke={isFail ? '#f87171' : '#22d3ee'} stroke-width="2" />
        <text y="-28" text-anchor="middle" fill={isFail ? '#fecaca' : '#67e8f9'} font-size="10.5" font-weight="800" font-family="ui-monospace,monospace">
          {isFail ? '⚠️ WRONG PASSWORD' : '🔑 PASSWORD + SALT'}
        </text>
        <text y="-6" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">
          {isFail ? ($locale === 'zh' ? '错误口令输入' : 'Wrong Password') : ($locale === 'zh' ? '用户口令 + 16B 盐' : 'Password + 16B Salt')}
        </text>
        <rect x="-80" y="10" width="160" height="32" rx="8" fill="rgba(255,255,255,0.05)" />
        <text y="24" text-anchor="middle" fill="#94a3b8" font-size="8.5" font-family="ui-monospace,monospace">Salt (16B):</text>
        <text y="37" text-anchor="middle" fill="#67e8f9" font-size="9" font-family="ui-monospace,monospace">{envelope.salt_hex.slice(0, 18)}…</text>
      </g>

      <!-- Arrow 1 -> 2 -->
      <line x1="207" y1="92" x2="258" y2="92" stroke={accent} stroke-width="2.2" stroke-dasharray="5 4" />
      {#if progress < 0.45}
        <circle cx={207 + 51 * (progress / 0.45)} cy="92" r="5" fill={accent} stroke="#fff" stroke-width="1.3" />
      {/if}

      <!-- Stage 2: PBKDF2-HMAC-SHA256 100,000 rounds -->
      <g transform="translate(362, 92)">
        <rect x="-104" y="-56" width="208" height="112" rx="14" fill="#131630" stroke="#a78bfa" stroke-width="2" />
        <text y="-28" text-anchor="middle" fill="#ddd6fe" font-size="10.5" font-weight="800" font-family="ui-monospace,monospace">
          ⚙️ PBKDF2-HMAC-SHA256
        </text>
        <text y="-4" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="800" font-family="ui-monospace,monospace">
          {kdfRoundsShown.toLocaleString()} / 100,000
        </text>
        <!-- Round bar -->
        <rect x="-82" y="10" width="164" height="8" rx="4" fill="rgba(255,255,255,0.12)" />
        <rect x="-82" y="10" width={Math.round((kdfRoundsShown / 100000) * 164)} height="8" rx="4" fill="#a78bfa" />
        <text y="36" text-anchor="middle" fill="#c4b5fd" font-size="9" font-family="ui-monospace,monospace">
          → {isFail ? 'Mismatched 256-bit Key' : '256-bit AES Key (HSM)'}
        </text>
      </g>

      <!-- Arrow 2 -> 3 -->
      <line x1="466" y1="92" x2="516" y2="92" stroke={accent} stroke-width="2.2" stroke-dasharray="5 4" />
      {#if progress >= 0.45}
        <circle cx={466 + 50 * gcmPhase} cy="92" r="5" fill={accent} stroke="#fff" stroke-width="1.3" />
      {/if}

      <!-- Stage 3: AES-256-GCM + 12B Nonce + 16B Auth Tag -->
      <g transform="translate(632, 92)">
        <rect x="-116" y="-56" width="232" height="112" rx="14" fill={isFail ? '#241018' : '#0f1c24'} stroke={accent} stroke-width="2.2" />
        <text y="-28" text-anchor="middle" fill={isFail ? '#fecaca' : '#67e8f9'} font-size="10.5" font-weight="800" font-family="ui-monospace,monospace">
          {isFail ? '💥 GHASH TAG MISMATCH' : isOk ? '✓ GHASH TAG VERIFIED' : '🔒 AES-256-GCM AEAD'}
        </text>
        <text y="-6" text-anchor="middle" fill="#fff" font-size="10.5" font-family="ui-monospace,monospace">
          IV/Nonce (12B): {envelope.nonce_hex.slice(0, 14)}…
        </text>
        <text y="14" text-anchor="middle" fill="#cbd5e1" font-size="9.5" font-family="ui-monospace,monospace">
          Tag (16B): {envelope.auth_tag_hex.slice(0, 18)}…
        </text>
        <rect x="-98" y="24" width="196" height="22" rx="7" fill={isFail ? 'rgba(239,68,68,0.22)' : 'rgba(52,211,153,0.16)'} />
        <text y="38.5" text-anchor="middle" fill={isFail ? '#fecaca' : '#a7f3d0'} font-size="9.5" font-weight="700">
          {isFail
            ? $locale === 'zh'
              ? '🚫 拒绝解密 · 0 字节明文泄露'
              : '🚫 Rejected · 0 Bytes Leaked'
            : isOk
              ? $locale === 'zh'
                ? `✓ 还原 ${envelope.curves.length} 条曲线分片`
                : `✓ Restored ${envelope.curves.length} Curve Shares`
              : $locale === 'zh'
                ? `加密耗时 ${envelope.elapsed_ms.toFixed(0)} ms`
                : `Sealed in ${envelope.elapsed_ms.toFixed(0)} ms`}
        </text>
      </g>

      <!-- Stage 4: Result Icon on Right -->
      <g transform="translate(812, 92)">
        <circle r="40" fill={isFail ? 'rgba(239,68,68,0.16)' : 'rgba(52,211,153,0.16)'} stroke={isFail ? '#f87171' : '#34d399'} stroke-width="2" />
        <text y="-4" text-anchor="middle" font-size="22">{isFail ? '🛡️' : isOk ? '🔓' : '📦'}</text>
        <text y="18" text-anchor="middle" fill="#fff" font-size="9.5" font-weight="700" font-family="ui-monospace,monospace">
          {isFail ? 'BLOCKED' : isOk ? 'RESTORED' : '.JSON'}
        </text>
      </g>

      <!-- Bottom Binary Envelope Layout Bar -->
      <g transform="translate(24, 174)">
        <text x="0" y="-4" fill="#94a3b8" font-size="9.5" font-family="ui-monospace,monospace">
          {$locale === 'zh' ? '加密密文二进制结构（starlab-keystore-v2）：' : 'Binary Envelope Layout (starlab-keystore-v2):'}
        </text>
        <rect x="0" y="6" width="140" height="32" rx="6" fill="rgba(34,211,238,0.18)" stroke="#22d3ee" />
        <text x="70" y="26" text-anchor="middle" fill="#67e8f9" font-size="10" font-weight="700" font-family="ui-monospace,monospace">
          Salt · 16 B
        </text>

        <rect x="148" y="6" width="130" height="32" rx="6" fill="rgba(167,139,250,0.18)" stroke="#a78bfa" />
        <text x="213" y="26" text-anchor="middle" fill="#ddd6fe" font-size="10" font-weight="700" font-family="ui-monospace,monospace">
          Nonce · 12 B
        </text>

        <rect x="286" y="6" width="386" height="32" rx="6" fill="rgba(59,130,246,0.16)" stroke="#60a5fa" />
        <text x="479" y="26" text-anchor="middle" fill="#bfdbfe" font-size="10" font-weight="700" font-family="ui-monospace,monospace">
          AES-256-GCM Ciphertext · {envelope.ciphertext_bytes} B ({envelope.curves.join(' + ')})
        </text>

        <rect x="680" y="6" width="152" height="32" rx="6" fill={isFail ? 'rgba(239,68,68,0.22)' : 'rgba(52,211,153,0.18)'} stroke={isFail ? '#f87171' : '#34d399'} />
        <text x="756" y="26" text-anchor="middle" fill={isFail ? '#fecaca' : '#a7f3d0'} font-size="10" font-weight="700" font-family="ui-monospace,monospace">
          Auth Tag · 16 B
        </text>
      </g>
    </svg>
  </div>
</div>
