<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { locale } from '../lib/i18n';
  import type {
    DeviceLogEntry,
    FlowScene,
    FlowStage,
    FlowTone,
    VirtualDevice,
    WirePacket,
  } from '../lib/mpcSandbox';

  export let scene: FlowScene;
  export let devices: VirtualDevice[] = [];
  /** If true, keeps looping the current stage (e.g. while CGGMP24 Web Worker is computing) */
  export let loopForever = false;
  /** Called right before entering a future stage so real Rust WASM executes that stage live */
  export let onAdvanceStage: ((targetStage: number) => Promise<void> | void) | null = null;
  /** Called when user clicks Prev / Re-roll Seeds / Replay so real Rust WASM rolls fresh CSPRNG seeds or nonces */
  export let onStepBackFresh: ((targetStage: number, reason: 'step-back' | 'reseed') => Promise<void> | void) | null =
    null;

  let stageIdx = 0;
  let stageProgress = 0; // 0..1 within current stage
  let playing = true;
  let finished = false;
  let speed: 0.5 | 1 | 2 = 1;
  let showWireTable = false;
  let inspectedDeviceIdx: number | null = null;
  let advancingBusy = false;

  let lastRunId = -1;
  let lastSeedEpoch = -1;
  let pendingTargetStage: number | null = null;
  let seedFlash = false;
  let seedFlashTimer: ReturnType<typeof setTimeout> | null = null;
  let wasmToast = '';
  let wasmToastTimer: ReturnType<typeof setTimeout> | null = null;
  let copiedHex = '';

  let rafId = 0;
  let lastTs = 0;
  let ambientTime = 0;

  function triggerSeedFlash(toastMsg?: string) {
    seedFlash = true;
    if (seedFlashTimer) clearTimeout(seedFlashTimer);
    seedFlashTimer = setTimeout(() => {
      seedFlash = false;
    }, 1100);
    if (toastMsg) {
      wasmToast = toastMsg;
      if (wasmToastTimer) clearTimeout(wasmToastTimer);
      wasmToastTimer = setTimeout(() => {
        wasmToast = '';
      }, 2800);
    }
  }

  $: if (scene && scene.runId !== lastRunId) {
    const isFreshEpoch =
      scene.seedEpoch !== undefined && lastSeedEpoch !== -1 && scene.seedEpoch !== lastSeedEpoch;
    lastRunId = scene.runId;
    if (scene.seedEpoch !== undefined) lastSeedEpoch = scene.seedEpoch;

    stageIdx = pendingTargetStage !== null ? Math.max(0, Math.min(scene.stages.length - 1, pendingTargetStage)) : 0;
    pendingTargetStage = null;
    stageProgress = 0;
    playing = true;
    finished = false;
    lastTs = 0;

    if (isFreshEpoch) {
      triggerSeedFlash(
        scene.kind === 'dkg'
          ? $locale === 'zh'
            ? `⚡ Rust WASM 已重新生成全新 32B 随机种子 (Seed #${scene.seedEpoch})`
            : `⚡ Rust WASM rolled brand-new 32B CSPRNG seeds (Seed #${scene.seedEpoch})`
          : $locale === 'zh'
            ? `⚡ Rust WASM 已重摇一次性随机数并重新计算签名 (#${scene.seedEpoch})`
            : `⚡ Rust WASM rolled fresh single-use nonces (#${scene.seedEpoch})`,
      );
    }
  }

  $: currentStage = (scene?.stages[stageIdx] ?? scene?.stages[0]) as FlowStage | undefined;
  $: totalStages = scene?.stages.length ?? 0;

  // Ensure inspected device stays valid if total device count shrinks (e.g. 5 -> 3)
  $: if (inspectedDeviceIdx !== null && !devices.some((d) => d.index === inspectedDeviceIdx)) {
    inspectedDeviceIdx = devices[0]?.index ?? null;
  }

  const TONE_HEX: Record<FlowTone, { stroke: string; fill: string; soft: string; text: string }> = {
    cyan: { stroke: '#22d3ee', fill: '#06b6d4', soft: 'rgba(34,211,238,0.16)', text: '#67e8f9' },
    violet: { stroke: '#a78bfa', fill: '#8b5cf6', soft: 'rgba(167,139,250,0.18)', text: '#ddd6fe' },
    pink: { stroke: '#f472b6', fill: '#ec4899', soft: 'rgba(244,114,182,0.18)', text: '#fbcfe8' },
    emerald: { stroke: '#34d399', fill: '#10b981', soft: 'rgba(52,211,153,0.18)', text: '#a7f3d0' },
    amber: { stroke: '#fbbf24', fill: '#f59e0b', soft: 'rgba(251,191,36,0.18)', text: '#fde68a' },
    red: { stroke: '#f87171', fill: '#ef4444', soft: 'rgba(248,113,113,0.20)', text: '#fecaca' },
  };

  function toneColors(tone?: FlowTone) {
    return TONE_HEX[tone || 'cyan'];
  }

  async function enterForwardStage(nextIdx: number) {
    if (advancingBusy) return;
    const clamped = Math.max(0, Math.min(totalStages - 1, nextIdx));
    if (onAdvanceStage && scene.stages[clamped]?.computed === false) {
      advancingBusy = true;
      try {
        await onAdvanceStage(clamped);
      } finally {
        advancingBusy = false;
      }
    }
    stageIdx = clamped;
    stageProgress = 0;
    playing = true;
    finished = false;
    lastTs = 0;
  }

  function tick(ts: number) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(80, ts - lastTs);
    lastTs = ts;
    ambientTime += dt;

    if (playing && !advancingBusy && currentStage) {
      const dur = Math.max(1200, currentStage.durationMs) / speed;
      stageProgress += dt / dur;
      if (stageProgress >= 1) {
        if (stageIdx < totalStages - 1) {
          stageProgress = 1;
          void enterForwardStage(stageIdx + 1);
        } else if (loopForever) {
          stageIdx = 0;
          stageProgress = 0;
        } else {
          stageProgress = 1;
          playing = false;
          finished = true;
        }
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  onMount(() => {
    rafId = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
    if (seedFlashTimer) clearTimeout(seedFlashTimer);
    if (wasmToastTimer) clearTimeout(wasmToastTimer);
  });

  function togglePlay() {
    if (finished) {
      void handleReseedOrReplay('reseed');
      return;
    }
    playing = !playing;
    lastTs = 0;
  }

  async function handleReseedOrReplay(reason: 'step-back' | 'reseed', target = 0) {
    if (advancingBusy) return;
    if (onStepBackFresh) {
      advancingBusy = true;
      pendingTargetStage = target;
      try {
        await onStepBackFresh(target, reason);
      } finally {
        advancingBusy = false;
      }
    } else {
      stageIdx = target;
      stageProgress = 0;
      playing = true;
      finished = false;
      lastTs = 0;
    }
  }

  async function handleStepClick(idx: number) {
    if (advancingBusy) return;
    if (idx <= stageIdx && onStepBackFresh) {
      // Stepping backward or clicking Step 0 re-rolls real WASM seeds/nonces!
      await handleReseedOrReplay('step-back', idx);
    } else if (idx > stageIdx) {
      await enterForwardStage(idx);
    } else {
      stageIdx = idx;
      stageProgress = 0;
      playing = true;
      finished = false;
      lastTs = 0;
    }
  }

  function prevStage() {
    const target = Math.max(0, stageIdx - 1);
    void handleReseedOrReplay('step-back', target);
  }

  function nextStage() {
    if (stageIdx < totalStages - 1) {
      void enterForwardStage(stageIdx + 1);
    } else {
      void handleReseedOrReplay('reseed', 0);
    }
  }

  function toggleInspectDevice(idx: number) {
    inspectedDeviceIdx = inspectedDeviceIdx === idx ? null : idx;
  }

  function copySmall(val: string) {
    navigator.clipboard?.writeText(val);
    copiedHex = val;
    setTimeout(() => {
      if (copiedHex === val) copiedHex = '';
    }, 1500);
  }

  interface Point {
    x: number;
    y: number;
  }

  function computeNodePositions(devs: VirtualDevice[], hasChain: boolean): Record<number, Point> {
    const pos: Record<number, Point> = {};
    const n = devs.length || 3;
    const cx = hasChain ? 320 : 440;
    const cy = 212;
    pos[0] = { x: cx, y: cy };
    pos[-1] = { x: 772, y: cy };

    if (n === 2) {
      const dx = hasChain ? 190 : 235;
      pos[devs[0].index] = { x: cx - dx, y: 112 };
      pos[devs[1].index] = { x: cx + dx, y: 112 };
      pos[0] = { x: cx, y: 298 };
      pos[-1] = { x: 772, y: 298 };
    } else if (n === 3) {
      const rx = hasChain ? 200 : 265;
      pos[devs[0].index] = { x: cx, y: 74 };
      pos[devs[1].index] = { x: cx - rx, y: 332 };
      pos[devs[2].index] = { x: cx + rx, y: 332 };
    } else {
      const rx = hasChain ? 205 : 292;
      const ry = 148;
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        pos[devs[i].index] = {
          x: cx + rx * Math.cos(angle),
          y: 208 + ry * Math.sin(angle),
        };
      }
    }
    return pos;
  }

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function bezierGeometry(a: Point, b: Point, bendOffset: number) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const cx = mx + nx * bendOffset;
    const cy = my + ny * bendOffset;
    return {
      pathD: `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
      pointAt(t: number): Point {
        const u = 1 - t;
        return {
          x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
          y: u * u * a.y + 2 * u * t * cy + t * t * b.y,
        };
      },
    };
  }

  function formatBytes(b: number): string {
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
  }

  function nodeName(id: number, zh: boolean): string {
    if (id === 0) return zh ? 'WebRTC 聚合节点' : 'WebRTC Hub';
    if (id === -1) return zh ? '区块链主网' : 'Blockchain';
    const d = devices.find((x) => x.index === id);
    if (!d) return `#${id}`;
    return `#${d.index} ${zh ? d.labelZh : d.labelEn}`;
  }

  function deviceHostPrompt(dev: VirtualDevice): string {
    if (dev.index === 1) return `chrome-ext://${dev.id} · wasm32-unknown`;
    if (dev.index === 2) return `starlab-desktop@${dev.id} · rustc-native`;
    if (dev.index === 3) return `/dev/ttyUSB0@115200 · ESP32-S3 (${dev.id})`;
    return `starlab-cli@${dev.id} · headless-node`;
  }

  function logLevelClass(level: DeviceLogEntry['level']): string {
    if (level === 'ok') return 'text-emerald-300 bg-emerald-500/15 border-emerald-400/35';
    if (level === 'tx') return 'text-cyan-300 bg-cyan-500/15 border-cyan-400/35';
    if (level === 'rx') return 'text-violet-300 bg-violet-500/15 border-violet-400/35';
    if (level === 'warn') return 'text-amber-300 bg-amber-500/15 border-amber-400/35';
    if (level === 'err') return 'text-red-300 bg-red-500/20 border-red-400/45';
    return 'text-slate-300 bg-white/10 border-white/15';
  }

  $: hasChainTarget = Boolean(currentStage?.showChainTarget);
  $: positions = computeNodePositions(devices, hasChainTarget);

  $: meshEdges = (() => {
    const list: { key: string; a: Point; b: Point }[] = [];
    for (let i = 0; i < devices.length; i++) {
      for (let j = i + 1; j < devices.length; j++) {
        const pa = positions[devices[i].index];
        const pb = positions[devices[j].index];
        if (pa && pb) list.push({ key: `m-${i}-${j}`, a: pa, b: pb });
      }
      const p = positions[devices[i].index];
      if (p && positions[0]) list.push({ key: `h-${i}`, a: p, b: positions[0] });
    }
    return list;
  })();

  interface AnimatedPacket {
    pkt: WirePacket;
    pathD: string;
    x: number;
    y: number;
    visible: boolean;
    opacity: number;
    blockedFlash: boolean;
    colors: { stroke: string; fill: string; soft: string; text: string };
  }

  $: animatedPackets = (() => {
    if (!currentStage) return [] as AnimatedPacket[];
    const edgeCounts = new Map<string, number>();

    return currentStage.packets
      .map((pkt) => {
        const a = positions[pkt.from];
        const b = positions[pkt.to];
        if (!a || !b) return null;

        const edgeKey = `${pkt.from}->${pkt.to}`;
        const dup = edgeCounts.get(edgeKey) ?? 0;
        edgeCounts.set(edgeKey, dup + 1);

        const baseBend = pkt.to === -1 ? 0 : pkt.to === 0 ? 24 : 36;
        const bend = baseBend + dup * 26;
        const geom = bezierGeometry(a, b, bend);

        const stagger = pkt.stagger ?? 0;
        const localRaw = (stageProgress - stagger) / Math.max(0.25, 1 - stagger);
        const isRedBlocked = Boolean(currentStage.blockedShield && pkt.tone === 'red');

        let tPos = 0;
        let opacity = 1;
        let blockedFlash = false;

        if (localRaw < 0) {
          return {
            pkt,
            pathD: geom.pathD,
            x: a.x,
            y: a.y,
            visible: false,
            opacity: 0,
            blockedFlash: false,
            colors: toneColors(pkt.tone),
          };
        }

        if (isRedBlocked) {
          if (localRaw < 0.56) {
            tPos = easeInOutCubic(localRaw / 0.56) * 0.62;
            opacity = 1;
          } else {
            const after = Math.min(1, (localRaw - 0.56) / 0.44);
            tPos = 0.62 - Math.sin(after * Math.PI * 0.7) * 0.14;
            blockedFlash = after < 0.65;
            opacity = Math.max(0.18, 1 - after * 0.82);
          }
        } else {
          const clamped = Math.min(1, localRaw);
          tPos = easeInOutCubic(clamped);
          opacity = clamped >= 0.995 ? 0.55 : 1;
        }

        const pt = geom.pointAt(tPos);
        return {
          pkt,
          pathD: geom.pathD,
          x: pt.x,
          y: pt.y,
          visible: true,
          opacity,
          blockedFlash,
          colors: toneColors(pkt.tone),
        };
      })
      .filter((x): x is AnimatedPacket => x !== null);
  })();

  $: pulseWave = (ambientTime % 1800) / 1800;
  $: isSeedStage = currentStage?.key === 'dkg-seed';

  $: inspectedDevice = inspectedDeviceIdx !== null ? devices.find((d) => d.index === inspectedDeviceIdx) ?? null : null;
  $: inspectedLogs = (() => {
    if (!inspectedDevice || !scene?.deviceLogs) return [] as DeviceLogEntry[];
    return (scene.deviceLogs[inspectedDevice.index] ?? []).filter((entry) => entry.stage <= stageIdx);
  })();
  $: inspectedTxBytes = inspectedLogs
    .filter((l) => l.level === 'tx')
    .reduce((acc, l) => acc + (l.bytes ?? 0), 0);
  $: inspectedRxBytes = inspectedLogs
    .filter((l) => l.level === 'rx' || (l.tag === 'ZK-CHECK' && (l.bytes ?? 0) > 0))
    .reduce((acc, l) => acc + (l.bytes ?? 0), 0);

  function visibleLogCount(devIdx: number): number {
    return (scene?.deviceLogs?.[devIdx] ?? []).filter((e) => e.stage <= stageIdx).length;
  }

  $: sceneHeaderTitle = (() => {
    if (!scene) return '';
    const zh = $locale === 'zh';
    if (scene.kind === 'dkg') return zh ? '⚡ 真实 Rust WASM 实时执行 · 2 轮 DKG 种子与分片流动' : '⚡ Live Rust WASM Execution · 2-Round DKG & Share Flow';
    if (scene.kind === 'attack') return zh ? '🛡️ 真实安全拦截 · 单设备木马窃片攻击实测' : '🛡️ Live Security Proof · Single-Device Attack Blocked';
    if (scene.kind === 'reshare') return zh ? '🔄 真实换片协议 · 丢设备无换地址 Reshare 流动' : '🔄 Live Reshare Execution · Address-Preserving Refresh';
    return zh ? '✍️ 真实门限签名 · 多设备协同与链上广播' : '✍️ Live Threshold Signing · Co-Signing & Broadcast';
  })();
</script>

{#if scene && currentStage}
  <div class="rounded-2xl border border-brand-neon/35 bg-[#090f1d] shadow-[0_18px_50px_rgba(0,0,0,0.55)] overflow-hidden">
    <!-- Top Header + Controls -->
    <div class="px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[0.025] flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full {playing ? 'bg-brand-neon animate-ping' : 'bg-emerald-400'} shrink-0"></span>
        <span class="text-xs sm:text-sm font-bold text-white truncate">{sceneHeaderTitle}</span>
        {#if scene.seedEpoch}
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/35">
            {scene.kind === 'dkg' ? `CSPRNG Seed #${scene.seedEpoch}` : `WASM Nonce #${scene.seedEpoch}`}
          </span>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        {#if onStepBackFresh}
          <button
            type="button"
            disabled={advancingBusy}
            on:click={() => handleReseedOrReplay('reseed', stageIdx)}
            class="px-2.5 py-1 rounded-lg bg-emerald-500/18 hover:bg-emerald-500/30 border border-emerald-400/45 text-[11px] font-mono font-bold text-emerald-300 cursor-pointer disabled:opacity-45"
            title={$locale === 'zh' ? '立即调用 Rust WASM getrandom() 重新生成全新随机种子/随机数' : 'Invoke Rust WASM CSPRNG to roll fresh random seeds/nonces'}
          >
            🎲 {scene.kind === 'dkg'
              ? $locale === 'zh'
                ? '换新随机种子'
                : 'Roll New Seeds'
              : $locale === 'zh'
                ? '重摇 Nonce'
                : 'Roll Nonce'}
          </button>
        {/if}

        <button
          type="button"
          on:click={prevStage}
          disabled={advancingBusy || (!onStepBackFresh && stageIdx === 0)}
          class="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 disabled:opacity-35 text-[11px] font-mono text-white cursor-pointer"
          title={$locale === 'zh' ? '返回上一步并由 WASM 重新摇新随机种子' : 'Step back & roll fresh WASM seeds'}
        >
          ⏮ {$locale === 'zh' ? (onStepBackFresh ? '上一步(换种子)' : '上一步') : 'Prev'}
        </button>

        <button
          type="button"
          on:click={togglePlay}
          disabled={advancingBusy}
          class="px-3 py-1 rounded-lg bg-brand-neon/20 hover:bg-brand-neon/30 border border-brand-neon/45 text-[11px] font-mono font-bold text-brand-neon cursor-pointer"
        >
          {#if playing}
            ⏸ {$locale === 'zh' ? '暂停' : 'Pause'}
          {:else if finished}
            🔄 {$locale === 'zh' ? '重跑 WASM' : 'Re-run WASM'}
          {:else}
            ▶ {$locale === 'zh' ? '继续' : 'Play'}
          {/if}
        </button>

        <button
          type="button"
          on:click={nextStage}
          disabled={advancingBusy}
          class="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-[11px] font-mono text-white cursor-pointer"
        >
          {stageIdx < totalStages - 1
            ? $locale === 'zh'
              ? '执行下一步 ⏭'
              : 'Run Next ⏭'
            : $locale === 'zh'
              ? '重新真机跑 🔄'
              : 'Fresh Run 🔄'}
        </button>

        <div class="flex items-center rounded-lg bg-black/50 border border-white/10 p-0.5 ml-1">
          {#each [0.5, 1, 2] as sp}
            <button
              type="button"
              on:click={() => (speed = sp as 0.5 | 1 | 2)}
              class="px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition {speed === sp
                ? 'bg-violet-500/40 text-white font-bold'
                : 'text-white/55 hover:text-white'}"
            >
              {sp}×
            </button>
          {/each}
        </div>
      </div>
    </div>

    {#if wasmToast}
      <div class="px-4 sm:px-5 py-2 bg-emerald-500/15 border-b border-emerald-400/35 text-xs font-mono text-emerald-200 flex items-center justify-between gap-2">
        <span>{wasmToast}</span>
        <span class="text-[10px] text-emerald-300/80">starlab_core_wasm_bg.wasm</span>
      </div>
    {/if}

    <!-- Clickable Step Timeline Bar -->
    <div class="px-4 sm:px-5 py-2.5 border-b border-white/10 bg-black/30 flex items-center gap-2 overflow-x-auto">
      {#each scene.stages as st, idx}
        {@const active = idx === stageIdx}
        {@const done = idx < stageIdx || (idx === stageIdx && finished)}
        <button
          type="button"
          on:click={() => handleStepClick(idx)}
          class="relative flex-1 min-w-[140px] text-left px-3 py-2 rounded-xl border transition cursor-pointer overflow-hidden {active
            ? 'border-brand-neon/60 bg-brand-neon/10 text-white'
            : done
              ? 'border-emerald-400/30 bg-emerald-500/8 text-emerald-200 hover:bg-emerald-500/15'
              : 'border-white/10 bg-white/[0.02] text-white/55 hover:text-white/85'}"
        >
          {#if active}
            <div
              class="absolute inset-y-0 left-0 bg-brand-neon/15 pointer-events-none"
              style="width: {Math.round(stageProgress * 100)}%"
            ></div>
          {/if}
          <div class="relative flex items-center justify-between gap-2 text-[10px] font-mono">
            <span class={active ? 'text-brand-neon font-bold' : done ? 'text-emerald-300' : 'text-white/45'}>
              {done && !active ? '✓' : `STEP ${idx + 1}/${totalStages}`}
            </span>
            <span class="text-white/45">
              {st.computed === false
                ? $locale === 'zh'
                  ? '待计算'
                  : 'pending'
                : st.packets.length > 0
                  ? `${st.packets.length} pkts`
                  : '0 wire'}
            </span>
          </div>
          <div class="relative text-[11px] font-semibold truncate mt-0.5">
            {($locale === 'zh' ? st.titleZh : st.titleEn).replace(/^第 \d+ [步轮]\s*[·(]?\s*/, '')}
          </div>
        </button>
      {/each}
    </div>

    <!-- Plain-Language Beginner Narration Banner -->
    <div class="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-gradient-to-r from-brand-neon/[0.07] via-violet-500/[0.06] to-transparent space-y-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-brand-neon/20 text-brand-neon border border-brand-neon/40">
            {$locale === 'zh' ? `真机 WASM · 第 ${stageIdx + 1}/${totalStages} 步` : `LIVE WASM · STEP ${stageIdx + 1}/${totalStages}`}
          </span>
          <h4 class="text-xs sm:text-sm font-bold text-white">
            {$locale === 'zh' ? currentStage.titleZh : currentStage.titleEn}
          </h4>
        </div>
        <span class="text-[11px] font-mono text-amber-300/90">
          👆 {$locale === 'zh' ? '点击任意设备节点，打开该机器的真实终端日志' : 'Click any device node to inspect live terminal logs'}
        </span>
      </div>
      <p class="text-xs sm:text-[13px] text-white/80 leading-relaxed">
        {$locale === 'zh' ? currentStage.explainZh : currentStage.explainEn}
      </p>
    </div>

    <!-- 60FPS Interactive SVG Network Topology & Packet Flow Stage -->
    <div class="relative bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.08),rgba(9,15,29,0.98)_72%)] px-2 sm:px-4 py-3">
      <svg
        viewBox="0 0 880 416"
        class="w-full h-auto max-h-[435px] select-none"
        role="img"
        aria-label="Live Rust WASM MPC protocol data flow"
      >
        <defs>
          <filter id="glow-orb" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="grid-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.9" fill="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="880" height="416" fill="url(#grid-dots)" />

        <!-- Background Mesh Links -->
        {#each meshEdges as edge (edge.key)}
          <line
            x1={edge.a.x}
            y1={edge.a.y}
            x2={edge.b.x}
            y2={edge.b.y}
            stroke="rgba(148,163,184,0.16)"
            stroke-width="1.25"
            stroke-dasharray="5 6"
          />
        {/each}

        <!-- Optional Hub -> Blockchain Broadcast Link -->
        {#if hasChainTarget && positions[0] && positions[-1]}
          <line
            x1={positions[0].x}
            y1={positions[0].y}
            x2={positions[-1].x}
            y2={positions[-1].y}
            stroke="rgba(52,211,153,0.35)"
            stroke-width="2"
            stroke-dasharray="6 6"
          />
        {/if}

        <!-- Active Packet Arcs -->
        {#each animatedPackets as ap (ap.pkt.id)}
          <path
            d={ap.pathD}
            fill="none"
            stroke={ap.colors.stroke}
            stroke-width="2.4"
            stroke-opacity={ap.visible ? 0.34 : 0.1}
            stroke-dasharray="7 5"
          />
        {/each}

        <!-- Center WebRTC Relay / Aggregator Hub (Sleek Rounded Capsule - Zero Text Overflow!) -->
        {#if positions[0]}
          {@const hub = positions[0]}
          {@const hubTone = toneColors(currentStage.centerStatus?.tone || 'cyan')}
          <g transform="translate({hub.x}, {hub.y})">
            <rect
              x={-78 - pulseWave * 14}
              y={-44 - pulseWave * 10}
              width={156 + pulseWave * 28}
              height={88 + pulseWave * 20}
              rx="26"
              fill="none"
              stroke={currentStage.blockedShield ? '#f87171' : hubTone.stroke}
              stroke-width="1.5"
              stroke-opacity={(1 - pulseWave) * 0.45}
            />

            {#if currentStage.blockedShield}
              <rect
                x="-88"
                y="-52"
                width="176"
                height="104"
                rx="30"
                fill="rgba(239,68,68,0.12)"
                stroke="#f87171"
                stroke-width="2.5"
                stroke-dasharray="8 4"
              />
            {/if}

            <rect
              x="-76"
              y="-42"
              width="152"
              height="84"
              rx="22"
              fill="#0d1527"
              stroke={currentStage.blockedShield ? '#f87171' : hubTone.stroke}
              stroke-width="2.2"
            />
            <text
              y="-15"
              text-anchor="middle"
              fill={hubTone.text}
              font-size="10.5"
              font-weight="700"
              font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {currentStage.blockedShield ? '🛡️ FIREWALL' : isSeedStage ? '🔒 0 BYTES' : '⚡ MESH HUB'}
            </text>
            <text y="4" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">
              {$locale === 'zh'
                ? (currentStage.centerStatus?.titleZh || 'WebRTC P2P').slice(0, 12)
                : (currentStage.centerStatus?.titleEn || 'WebRTC P2P').slice(0, 18)}
            </text>
            <text
              y="23"
              text-anchor="middle"
              fill="rgba(255,255,255,0.68)"
              font-size="9.5"
              font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {(currentStage.centerStatus?.detail || '').slice(0, 20)}
            </text>
          </g>
        {/if}

        <!-- Optional Blockchain Network Target Node -->
        {#if hasChainTarget && positions[-1]}
          {@const chainPos = positions[-1]}
          <g transform="translate({chainPos.x}, {chainPos.y})">
            <rect
              x="-86"
              y="-54"
              width="172"
              height="108"
              rx="18"
              fill="#0a1e1d"
              stroke="#34d399"
              stroke-width="2.2"
            />
            <rect
              x={-90 - pulseWave * 10}
              y={-58 - pulseWave * 8}
              width={180 + pulseWave * 20}
              height={116 + pulseWave * 16}
              rx="22"
              fill="none"
              stroke="#34d399"
              stroke-width="1.4"
              stroke-opacity={(1 - pulseWave) * 0.45}
            />
            <text y="-18" text-anchor="middle" font-size="22">⛓️</text>
            <text y="6" text-anchor="middle" fill="#a7f3d0" font-size="12" font-weight="700">
              {$locale === 'zh' ? '区块链主网节点' : 'Blockchain Network'}
            </text>
            <text
              y="24"
              text-anchor="middle"
              fill="rgba(255,255,255,0.72)"
              font-size="9.5"
              font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {$locale === 'zh' ? '标准单签 · 链上验签 ✓' : 'Standard Sig · Verified ✓'}
            </text>
          </g>
        {/if}

        <!-- Clickable Device Nodes (Click any machine to inspect live terminal logs!) -->
        {#each devices as dev (dev.index)}
          {@const p = positions[dev.index]}
          {#if p}
            {@const note = currentStage.nodeNotes[dev.index]}
            {@const nColors = toneColors(note?.tone || (dev.compromised ? 'red' : 'cyan'))}
            {@const isSelected = inspectedDeviceIdx === dev.index}
            {@const logCount = visibleLogCount(dev.index)}
            <g
              transform="translate({p.x}, {p.y})"
              class="cursor-pointer"
              role="button"
              tabindex="0"
              aria-label={`Inspect device #${dev.index} logs`}
              on:click={() => toggleInspectDevice(dev.index)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleInspectDevice(dev.index);
                }
              }}
            >
              <!-- Selected highlight halo OR seed-roll sonar wave -->
              {#if isSelected}
                <rect
                  x="-110"
                  y="-54"
                  width="220"
                  height="108"
                  rx="20"
                  fill="rgba(34,211,238,0.08)"
                  stroke="#22d3ee"
                  stroke-width="2"
                  stroke-dasharray="6 4"
                />
              {:else if isSeedStage || seedFlash || (note?.tone === 'emerald' && stageIdx === totalStages - 1)}
                <rect
                  x={-105 - pulseWave * 8}
                  y={-49 - pulseWave * 6}
                  width={210 + pulseWave * 16}
                  height={98 + pulseWave * 12}
                  rx="19"
                  fill="none"
                  stroke={seedFlash ? '#fde047' : nColors.stroke}
                  stroke-width={seedFlash ? '2.4' : '1.6'}
                  stroke-opacity={(1 - pulseWave) * 0.6}
                />
              {/if}

              <!-- Device Card -->
              <rect
                x="-103"
                y="-47"
                width="206"
                height="94"
                rx="16"
                fill={isSelected ? '#152340' : '#111a30'}
                stroke={seedFlash ? '#fde047' : isSelected ? '#22d3ee' : nColors.stroke}
                stroke-width={isSelected || seedFlash ? '2.6' : '2'}
                fill-opacity={note?.tone === 'amber' && scene.kind !== 'reshare' ? '0.72' : '0.97'}
              />

              <!-- Header Row: Icon + Name + Clickable Logs Pill -->
              <text x="-90" y="-21" font-size="15">{dev.roleIcon}</text>
              <text x="-70" y="-21" fill="#ffffff" font-size="11.5" font-weight="700">
                #{dev.index} {($locale === 'zh' ? dev.labelZh : dev.labelEn).slice(0, 10)}
              </text>

              <!-- Interactive Terminal Pill -->
              <rect
                x="38"
                y="-36"
                width="56"
                height="20"
                rx="6"
                fill={isSelected ? '#22d3ee' : 'rgba(255,255,255,0.08)'}
                stroke={isSelected ? '#22d3ee' : 'rgba(255,255,255,0.22)'}
                stroke-width="1"
              />
              <text
                x="66"
                y="-22.5"
                text-anchor="middle"
                fill={isSelected ? '#07101f' : '#e2e8f0'}
                font-size="9"
                font-weight="700"
                font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                📟 {logCount}
              </text>

              <!-- Real-time Seed / Fingerprint Sub-row (flashes yellow/green when new WASM seed is rolled!) -->
              <text
                x="-90"
                y="-1"
                fill={seedFlash ? '#fde047' : 'rgba(255,255,255,0.62)'}
                font-size="9.5"
                font-weight={seedFlash ? '700' : '400'}
                font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                {isSeedStage || stageIdx < 3 && scene.kind === 'dkg'
                  ? `Seed: ${dev.rootSecretHex.slice(0, 14)}…`
                  : `FP: ${dev.shareFingerprint.slice(0, 14)}`}
              </text>

              {#if seedFlash}
                <text
                  x="92"
                  y="-1"
                  text-anchor="end"
                  fill="#4ade80"
                  font-size="9"
                  font-weight="800"
                  font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  NEW!
                </text>
              {/if}

              <!-- Dynamic Per-Stage Status Pill -->
              <rect
                x="-92"
                y="11"
                width="184"
                height="25"
                rx="8"
                fill={nColors.soft}
                stroke={nColors.stroke}
                stroke-opacity="0.48"
                stroke-width="1"
              />
              <text
                x="0"
                y="27"
                text-anchor="middle"
                fill={nColors.text}
                font-size="9.5"
                font-weight="700"
              >
                {($locale === 'zh' ? note?.zh : note?.en)?.slice(0, 22) || (dev.compromised ? 'REVOKED' : 'ACTIVE')}
              </text>
            </g>
          {/if}
        {/each}

        <!-- Flying Data Packets -->
        {#each animatedPackets as ap (ap.pkt.id)}
          {#if ap.visible}
            <g transform="translate({ap.x}, {ap.y})" opacity={ap.opacity} class="pointer-events-none">
              {#if ap.blockedFlash}
                <circle r="24" fill="rgba(239,68,68,0.28)" stroke="#f87171" stroke-width="2.5" />
                <text
                  y="-24"
                  text-anchor="middle"
                  fill="#fecaca"
                  font-size="11"
                  font-weight="800"
                  font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  💥 {$locale === 'zh' ? '拦截！0 bit 泄露' : 'BLOCKED · 0 BITS'}
                </text>
              {/if}

              <circle r="13" fill={ap.colors.soft} />
              <circle r="6.5" fill={ap.colors.fill} stroke="#ffffff" stroke-width="1.5" filter="url(#glow-orb)" />

              <g transform="translate(0, 19)">
                <rect
                  x="-54"
                  y="-9"
                  width="108"
                  height="18"
                  rx="9"
                  fill="#070d1a"
                  stroke={ap.colors.stroke}
                  stroke-width="1.2"
                />
                <text
                  y="3.2"
                  text-anchor="middle"
                  fill={ap.colors.text}
                  font-size="8.8"
                  font-weight="700"
                  font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {ap.pkt.tag} · {formatBytes(ap.pkt.bytes)}
                </text>
              </g>
            </g>
          {/if}
        {/each}
      </svg>

      <!-- Quick Device Console Switcher + Legend Bar -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 px-2 pt-2.5 border-t border-white/8">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] font-mono text-white/55 mr-1">
            📟 {$locale === 'zh' ? '点开机器实时日志:' : 'Machine Logs:'}
          </span>
          {#each devices as dev (dev.index)}
            {@const open = inspectedDeviceIdx === dev.index}
            <button
              type="button"
              on:click={() => toggleInspectDevice(dev.index)}
              class="px-2.5 py-1 rounded-lg text-[11px] font-mono border transition cursor-pointer {open
                ? 'bg-brand-neon/20 border-brand-neon text-brand-neon font-bold'
                : 'bg-white/[0.04] border-white/12 text-white/75 hover:border-white/30 hover:text-white'}"
            >
              {dev.roleIcon} #{dev.index} {$locale === 'zh' ? dev.labelZh : dev.labelEn}
              <span class="ml-1 opacity-70">({visibleLogCount(dev.index)})</span>
            </button>
          {/each}
        </div>

        <button
          type="button"
          on:click={() => (showWireTable = !showWireTable)}
          class="text-[11px] font-mono text-brand-neon hover:underline cursor-pointer"
        >
          {showWireTable
            ? $locale === 'zh'
              ? '收起网络抓包明细 ▲'
              : 'Hide Wire Capture ▲'
            : $locale === 'zh'
              ? `展开本步 ${currentStage.packets.length} 条网络抓包 ▼`
              : `Inspect ${currentStage.packets.length} Wire Packets ▼`}
        </button>
      </div>
    </div>

    <!-- Realistic Per-Machine Terminal Inspector Drawer -->
    {#if inspectedDevice}
      <div class="border-t border-brand-neon/35 bg-[#050912]">
        <!-- Terminal Window Chrome -->
        <div class="px-4 py-2.5 bg-[#0c1324] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="w-2.5 h-2.5 rounded-full bg-red-400/80"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400/80"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></span>
            </div>
            <span class="text-xs font-mono font-bold text-white truncate">
              {inspectedDevice.roleIcon} #{inspectedDevice.index} {$locale === 'zh' ? inspectedDevice.labelZh : inspectedDevice.labelEn}
            </span>
            <span class="text-[11px] font-mono text-cyan-300/80 hidden sm:inline">
              — {deviceHostPrompt(inspectedDevice)}
            </span>
          </div>
          <div class="flex items-center gap-2 text-[11px] font-mono">
            <span class="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              TX: {formatBytes(inspectedTxBytes)}
            </span>
            <span class="px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-400/30">
              RX: {formatBytes(inspectedRxBytes)}
            </span>
            <button
              type="button"
              on:click={() => (inspectedDeviceIdx = null)}
              class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
            >
              ✕ {$locale === 'zh' ? '关闭' : 'Close'}
            </button>
          </div>
        </div>

        <!-- Per-Device Live Cryptographic Memory Summary -->
        <div class="px-4 py-2.5 border-b border-white/8 bg-black/40 grid md:grid-cols-2 gap-2.5 text-[11px] font-mono">
          <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.025] border {seedFlash ? 'border-amber-300/60 bg-amber-500/10' : 'border-white/8'}">
            <div class="min-w-0">
              <div class="text-[10px] text-white/50 flex items-center gap-1.5">
                <span>RootSecret (32B CSPRNG)</span>
                <span class="text-red-300 font-bold">🔒 {$locale === 'zh' ? '绝不外发' : 'LOCAL ONLY'}</span>
              </div>
              <div class="text-cyan-200 truncate" title={inspectedDevice.rootSecretHex}>
                {inspectedDevice.rootSecretHex}
              </div>
            </div>
            <button
              type="button"
              on:click={() => copySmall(inspectedDevice!.rootSecretHex)}
              class="px-2 py-1 rounded bg-white/8 hover:bg-white/15 text-[10px] text-white/75 shrink-0 cursor-pointer"
            >
              {copiedHex === inspectedDevice.rootSecretHex ? '✓' : 'Copy'}
            </button>
          </div>

          <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.025] border border-white/8">
            <div class="min-w-0">
              <div class="text-[10px] text-white/50">
                {$locale === 'zh' ? '本地分片指纹 (每台机器唯一)' : 'Device Share Fingerprint (Unique)'}
              </div>
              <div class="text-emerald-300 truncate">{inspectedDevice.shareFingerprint}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] {inspectedDevice.compromised ? 'bg-red-500/20 text-red-300 border border-red-400/40' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'} shrink-0">
              {inspectedDevice.compromised
                ? $locale === 'zh'
                  ? '已作废'
                  : 'REVOKED'
                : inspectedDevice.ecdsaKeyShare
                  ? '3 Curves'
                  : 'WASM Active'}
            </span>
          </div>
        </div>

        <!-- Timestamped Live Rust WASM Execution Stream -->
        <div class="px-4 py-3 font-mono text-[11.5px] space-y-1.5 max-h-60 overflow-y-auto leading-relaxed">
          {#if inspectedLogs.length === 0}
            <div class="text-white/45">
              $ awaiting Rust WASM events on device #{inspectedDevice.index}…
            </div>
          {:else}
            {#each inspectedLogs as entry, i (i)}
              <div class="flex items-start gap-2">
                <span class="text-white/35 shrink-0">[{entry.ts}]</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 {logLevelClass(entry.level)}">
                  {entry.tag}
                </span>
                <div class="min-w-0 space-y-0.5">
                  <div class="text-white/90 break-words">
                    {$locale === 'zh' ? entry.msgZh : entry.msgEn}
                  </div>
                  {#if entry.hex}
                    <div class="text-[10.5px] text-cyan-300/75 break-all">
                      ↳ hex: {entry.hex}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          {/if}
          <div class="text-emerald-400/80 pt-1">
            $ starlab-node@{inspectedDevice.id}:~# <span class="inline-block w-2 h-3.5 bg-brand-neon align-middle animate-pulse"></span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Optional Wire Packet Capture Table -->
    {#if showWireTable}
      <div class="px-4 sm:px-5 py-3 border-t border-white/10 bg-black/45">
        {#if currentStage.packets.length === 0}
          <div class="text-xs font-mono text-cyan-200/90 py-1">
            🔒 {$locale === 'zh'
              ? '本步骤网络抓包 = 0 bytes（纯本地内存运算，种子与私钥绝不触网）'
              : 'Wire Capture = 0 bytes in this step (100% local computation — seeds never touch the wire)'}
          </div>
        {:else}
          <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {#each currentStage.packets as pkt (pkt.id)}
              {@const c = toneColors(pkt.tone)}
              <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/8 text-[11px] font-mono">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                    style="background:{c.soft}; color:{c.text}; border:1px solid {c.stroke}55"
                  >
                    {pkt.tag}
                  </span>
                  <span class="text-white/90 truncate">
                    {nodeName(pkt.from, $locale === 'zh')} → {nodeName(pkt.to, $locale === 'zh')}
                  </span>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-white/50 hidden sm:inline">{pkt.hexPreview}</span>
                  <span class="text-brand-neon font-bold">{formatBytes(pkt.bytes)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}
