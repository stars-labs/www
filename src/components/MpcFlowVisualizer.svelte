<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { locale } from '../lib/i18n';
  import type { FlowScene, FlowStage, FlowTone, VirtualDevice, WirePacket } from '../lib/mpcSandbox';

  export let scene: FlowScene;
  export let devices: VirtualDevice[] = [];
  /** If true, keeps looping the single/last stage (useful for in-progress Web Worker signing) */
  export let loopForever = false;

  let stageIdx = 0;
  let stageProgress = 0; // 0..1 within current stage
  let playing = true;
  let finished = false;
  let speed: 0.5 | 1 | 2 = 1;
  let showWireTable = true;

  let lastRunId = -1;
  let rafId = 0;
  let lastTs = 0;
  let ambientTime = 0;

  $: if (scene && scene.runId !== lastRunId) {
    lastRunId = scene.runId;
    stageIdx = 0;
    stageProgress = 0;
    playing = true;
    finished = false;
    lastTs = 0;
  }

  $: currentStage = (scene?.stages[stageIdx] ?? scene?.stages[0]) as FlowStage | undefined;
  $: totalStages = scene?.stages.length ?? 0;

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

  function tick(ts: number) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(80, ts - lastTs);
    lastTs = ts;
    ambientTime += dt;

    if (playing && currentStage) {
      const dur = Math.max(1200, currentStage.durationMs) / speed;
      stageProgress += dt / dur;
      if (stageProgress >= 1) {
        if (stageIdx < totalStages - 1) {
          stageIdx += 1;
          stageProgress = 0;
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
  });

  function togglePlay() {
    if (finished) {
      replayAll();
      return;
    }
    playing = !playing;
    lastTs = 0;
  }

  function replayAll() {
    stageIdx = 0;
    stageProgress = 0;
    playing = true;
    finished = false;
    lastTs = 0;
  }

  function jumpStage(idx: number) {
    stageIdx = Math.max(0, Math.min(totalStages - 1, idx));
    stageProgress = 0;
    playing = true;
    finished = false;
    lastTs = 0;
  }

  function prevStage() {
    jumpStage(Math.max(0, stageIdx - 1));
  }

  function nextStage() {
    if (stageIdx < totalStages - 1) {
      jumpStage(stageIdx + 1);
    } else {
      replayAll();
    }
  }

  interface Point {
    x: number;
    y: number;
  }

  function computeNodePositions(devs: VirtualDevice[], hasChain: boolean): Record<number, Point> {
    const pos: Record<number, Point> = {};
    const n = devs.length || 3;
    const cx = hasChain ? 325 : 440;
    const cy = 212;
    pos[0] = { x: cx, y: cy };
    pos[-1] = { x: 770, y: cy };

    if (n === 2) {
      const dx = hasChain ? 190 : 230;
      pos[devs[0].index] = { x: cx - dx, y: 118 };
      pos[devs[1].index] = { x: cx + dx, y: 118 };
      pos[0] = { x: cx, y: 295 };
      pos[-1] = { x: 770, y: 295 };
    } else if (n === 3) {
      const rx = hasChain ? 205 : 265;
      pos[devs[0].index] = { x: cx, y: 74 };
      pos[devs[1].index] = { x: cx - rx, y: 328 };
      pos[devs[2].index] = { x: cx + rx, y: 328 };
    } else {
      const rx = hasChain ? 210 : 288;
      const ry = 144;
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        pos[devs[i].index] = {
          x: cx + rx * Math.cos(angle),
          y: 206 + ry * Math.sin(angle),
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
    // Perpendicular right-hand normal ensures A->B and B->A separate cleanly
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
    if (id === -1) return zh ? '公链网络 (Broadcast)' : 'Blockchain Network';
    const d = devices.find((x) => x.index === id);
    if (!d) return `#${id}`;
    return `#${d.index} ${zh ? d.labelZh : d.labelEn}`;
  }

  $: hasChainTarget = Boolean(currentStage?.showChainTarget);
  $: positions = computeNodePositions(devices, hasChainTarget);

  // Pairwise mesh background edges
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
    arrivedPulse: boolean;
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
        // Map stageProgress into local 0..1 packet flight
        const localRaw = (stageProgress - stagger) / Math.max(0.25, 1 - stagger);
        const isRedBlocked = Boolean(currentStage.blockedShield && pkt.tone === 'red');

        let tPos = 0;
        let opacity = 1;
        let blockedFlash = false;
        let arrivedPulse = false;

        if (localRaw < 0) {
          return {
            pkt,
            pathD: geom.pathD,
            x: a.x,
            y: a.y,
            visible: false,
            opacity: 0,
            blockedFlash: false,
            arrivedPulse: false,
            colors: toneColors(pkt.tone),
          };
        }

        if (isRedBlocked) {
          // Fly toward hub shield (0 -> 0.62), slam into shield, recoil & fade!
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
          arrivedPulse = clamped > 0.88 && clamped < 0.999;
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
          arrivedPulse,
          colors: toneColors(pkt.tone),
        };
      })
      .filter((x): x is AnimatedPacket => x !== null);
  })();

  $: pulseWave = (ambientTime % 1800) / 1800; // 0..1 smooth sonar wave
  $: isSeedStage = currentStage?.key === 'dkg-seed';
  $: sceneHeaderTitle = (() => {
    if (!scene) return '';
    const zh = $locale === 'zh';
    if (scene.kind === 'dkg') return zh ? '🎬 实时协议动画 · 2 轮 DKG 种子隔离与分片流动' : '🎬 Live Protocol Animation · 2-Round DKG & Share Flow';
    if (scene.kind === 'attack') return zh ? '🛡️ 实时安全动画 · 单设备木马窃片攻击拦截' : '🛡️ Live Security Animation · Single-Device Attack Blocked';
    if (scene.kind === 'reshare') return zh ? '🔄 实时换片动画 · 丢设备无换地址 Reshare 流动' : '🔄 Live Reshare Animation · Address-Preserving Refresh';
    return zh ? '✍️ 实时签名动画 · 多设备协同多签与链上广播' : '✍️ Live Signing Animation · Threshold Co-Signing & Broadcast';
  })();
</script>

{#if scene && currentStage}
  <div class="rounded-2xl border border-brand-neon/30 bg-[#090f1d] shadow-[0_18px_50px_rgba(0,0,0,0.55)] overflow-hidden">
    <!-- Top Header + Controls -->
    <div class="px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[0.025] flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full {playing ? 'bg-brand-neon animate-ping' : 'bg-emerald-400'} shrink-0"></span>
        <span class="text-xs sm:text-sm font-bold text-white truncate">{sceneHeaderTitle}</span>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          on:click={prevStage}
          disabled={stageIdx === 0}
          class="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 disabled:opacity-35 text-[11px] font-mono text-white cursor-pointer"
          title={$locale === 'zh' ? '上一步' : 'Previous step'}
        >
          ⏮ {$locale === 'zh' ? '上一步' : 'Prev'}
        </button>
        <button
          type="button"
          on:click={togglePlay}
          class="px-3 py-1 rounded-lg bg-brand-neon/20 hover:bg-brand-neon/30 border border-brand-neon/45 text-[11px] font-mono font-bold text-brand-neon cursor-pointer"
        >
          {#if playing}
            ⏸ {$locale === 'zh' ? '暂停' : 'Pause'}
          {:else if finished}
            🔄 {$locale === 'zh' ? '重播动画' : 'Replay'}
          {:else}
            ▶ {$locale === 'zh' ? '继续' : 'Play'}
          {/if}
        </button>
        <button
          type="button"
          on:click={nextStage}
          class="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-[11px] font-mono text-white cursor-pointer"
        >
          {stageIdx < totalStages - 1
            ? $locale === 'zh'
              ? '下一步 ⏭'
              : 'Next ⏭'
            : $locale === 'zh'
              ? '重头看 🔄'
              : 'Restart 🔄'}
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

    <!-- Clickable Step Timeline Bar -->
    <div class="px-4 sm:px-5 py-2.5 border-b border-white/10 bg-black/30 flex items-center gap-2 overflow-x-auto">
      {#each scene.stages as st, idx}
        {@const active = idx === stageIdx}
        {@const done = idx < stageIdx || (idx === stageIdx && finished)}
        <button
          type="button"
          on:click={() => jumpStage(idx)}
          class="relative flex-1 min-w-[140px] text-left px-3 py-2 rounded-xl border transition cursor-pointer overflow-hidden {active
            ? 'border-brand-neon/60 bg-brand-neon/10 text-white'
            : done
              ? 'border-emerald-400/30 bg-emerald-500/8 text-emerald-200 hover:bg-emerald-500/15'
              : 'border-white/10 bg-white/[0.02] text-white/55 hover:text-white/85'}"
        >
          <!-- Animated progress fill inside active pill -->
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
              {st.packets.length > 0 ? `${st.packets.length} pkts` : '0 wire'}
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
      <div class="flex flex-wrap items-center gap-2">
        <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-brand-neon/20 text-brand-neon border border-brand-neon/40">
          {$locale === 'zh' ? `当前步骤 ${stageIdx + 1}/${totalStages}` : `STEP ${stageIdx + 1}/${totalStages}`}
        </span>
        <h4 class="text-xs sm:text-sm font-bold text-white">
          {$locale === 'zh' ? currentStage.titleZh : currentStage.titleEn}
        </h4>
      </div>
      <p class="text-xs sm:text-[13px] text-white/80 leading-relaxed">
        {$locale === 'zh' ? currentStage.explainZh : currentStage.explainEn}
      </p>
    </div>

    <!-- 60FPS Interactive SVG Network Topology & Packet Flow Stage -->
    <div class="relative bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.08),rgba(9,15,29,0.98)_72%)] px-2 sm:px-4 py-3">
      <svg
        viewBox="0 0 880 410"
        class="w-full h-auto max-h-[430px] select-none"
        role="img"
        aria-label="Live MPC protocol data flow animation"
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

        <!-- Subtle tech dot grid -->
        <rect x="0" y="0" width="880" height="410" fill="url(#grid-dots)" />

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

        <!-- Active Packet Arcs (Trails) -->
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

        <!-- Center WebRTC Relay / Aggregator Hub -->
        {#if positions[0]}
          {@const hub = positions[0]}
          {@const hubTone = toneColors(currentStage.centerStatus?.tone || 'cyan')}
          <g transform="translate({hub.x}, {hub.y})">
            <!-- Outer ambient sonar ring -->
            <circle
              r={46 + pulseWave * 22}
              fill="none"
              stroke={currentStage.blockedShield ? '#f87171' : hubTone.stroke}
              stroke-width="1.5"
              stroke-opacity={(1 - pulseWave) * 0.45}
            />

            {#if currentStage.blockedShield}
              <!-- Pulsing Red Cryptographic Firewall Shield -->
              <circle
                r="66"
                fill="rgba(239,68,68,0.12)"
                stroke="#f87171"
                stroke-width="2.5"
                stroke-dasharray="8 4"
              />
            {/if}

            <circle
              r="50"
              fill="#0d1527"
              stroke={currentStage.blockedShield ? '#f87171' : hubTone.stroke}
              stroke-width="2.2"
            />
            <text
              y="-14"
              text-anchor="middle"
              fill={hubTone.text}
              font-size="11"
              font-weight="700"
              font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {currentStage.blockedShield ? '🛡️ FIREWALL' : isSeedStage ? '🔒 0 BYTES' : '⚡ MESH HUB'}
            </text>
            <text y="5" text-anchor="middle" fill="#ffffff" font-size="10.5" font-weight="700">
              {$locale === 'zh'
                ? currentStage.centerStatus?.titleZh || 'WebRTC P2P'
                : currentStage.centerStatus?.titleEn || 'WebRTC P2P'}
            </text>
            <text
              y="22"
              text-anchor="middle"
              fill="rgba(255,255,255,0.68)"
              font-size="9"
              font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {(currentStage.centerStatus?.detail || '').slice(0, 24)}
            </text>
          </g>
        {/if}

        <!-- Optional Blockchain Network Target Node (Stage: Broadcast Verified Tx) -->
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
            <circle
              r={58 + pulseWave * 16}
              fill="none"
              stroke="#34d399"
              stroke-width="1.4"
              stroke-opacity={(1 - pulseWave) * 0.45}
            />
            <text y="-20" text-anchor="middle" font-size="22">⛓️</text>
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
              {$locale === 'zh' ? '标准单签格式 · 验签 ✓' : 'Standard Sig · Verified ✓'}
            </text>
          </g>
        {/if}

        <!-- Device Nodes -->
        {#each devices as dev (dev.index)}
          {@const p = positions[dev.index]}
          {#if p}
            {@const note = currentStage.nodeNotes[dev.index]}
            {@const nColors = toneColors(note?.tone || (dev.compromised ? 'red' : 'cyan'))}
            <g transform="translate({p.x}, {p.y})">
              <!-- Seed generation local aura OR active pulse -->
              {#if isSeedStage || (note?.tone === 'emerald' && stageIdx === totalStages - 1)}
                <rect
                  x={-98 - pulseWave * 8}
                  y={-46 - pulseWave * 6}
                  width={196 + pulseWave * 16}
                  height={92 + pulseWave * 12}
                  rx="18"
                  fill="none"
                  stroke={nColors.stroke}
                  stroke-width="1.6"
                  stroke-opacity={(1 - pulseWave) * 0.55}
                />
              {/if}

              <!-- Device Card -->
              <rect
                x="-95"
                y="-43"
                width="190"
                height="86"
                rx="16"
                fill="#111a30"
                stroke={nColors.stroke}
                stroke-width={note?.tone === 'amber' && !currentStage.packets.some((k) => k.from === dev.index || k.to === dev.index) ? '1.3' : '2.2'}
                fill-opacity={note?.tone === 'amber' && scene.kind !== 'reshare' ? '0.68' : '0.96'}
              />

              <!-- Header Row: Icon + Name -->
              <text x="-80" y="-17" font-size="16">{dev.roleIcon}</text>
              <text x="-58" y="-18" fill="#ffffff" font-size="12" font-weight="700">
                #{dev.index} {($locale === 'zh' ? dev.labelZh : dev.labelEn).slice(0, 14)}
              </text>

              <!-- Local Seed / Fingerprint Sub-row -->
              <text
                x="-80"
                y="2"
                fill="rgba(255,255,255,0.52)"
                font-size="9.5"
                font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                {isSeedStage
                  ? `Seed: ${dev.rootSecretHex.slice(0, 12)}…`
                  : `FP: ${dev.shareFingerprint.slice(0, 12)}`}
              </text>

              <!-- Dynamic Per-Stage Status Pill -->
              <rect
                x="-84"
                y="11"
                width="168"
                height="24"
                rx="8"
                fill={nColors.soft}
                stroke={nColors.stroke}
                stroke-opacity="0.45"
                stroke-width="1"
              />
              <text
                x="0"
                y="26.5"
                text-anchor="middle"
                fill={nColors.text}
                font-size="9.5"
                font-weight="700"
              >
                {($locale === 'zh' ? note?.zh : note?.en) || (dev.compromised ? 'REVOKED' : 'ACTIVE')}
              </text>
            </g>
          {/if}
        {/each}

        <!-- Flying Data Packets (On Top of Nodes) -->
        {#each animatedPackets as ap (ap.pkt.id)}
          {#if ap.visible}
            <g transform="translate({ap.x}, {ap.y})" opacity={ap.opacity}>
              <!-- Impact shockwave when blocked by shield -->
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

              <!-- Outer Halo + Core Orb -->
              <circle r="13" fill={ap.colors.soft} />
              <circle r="6.5" fill={ap.colors.fill} stroke="#ffffff" stroke-width="1.5" filter="url(#glow-orb)" />

              <!-- Floating Packet Tag Pill -->
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

      <!-- Subtle Bottom-Right Legend -->
      <div class="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 text-[10.5px] font-mono text-white/55 border-t border-white/8">
        <div class="flex flex-wrap items-center gap-3">
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>{$locale === 'zh' ? '公开承诺 / Nonce' : 'Public Commit / Nonce'}</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-violet-400"></span>{$locale === 'zh' ? '加密分片 / 局部签名' : 'Encrypted Share / Sig'}</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-pink-400"></span>{$locale === 'zh' ? 'CGGMP24 同态密文' : 'CGGMP24 Paillier'}</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>{$locale === 'zh' ? '验签通过 / 上链' : 'Verified / Broadcast'}</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>{$locale === 'zh' ? '非法攻击 / 旧片拦截' : 'Attack / Revoked'}</span>
        </div>
        <button
          type="button"
          on:click={() => (showWireTable = !showWireTable)}
          class="text-brand-neon hover:underline cursor-pointer"
        >
          {showWireTable
            ? $locale === 'zh'
              ? '收起本步数据包详情 ▲'
              : 'Hide Wire Packets ▲'
            : $locale === 'zh'
              ? `展开本步 ${currentStage.packets.length} 条真实数据包 ▼`
              : `Inspect ${currentStage.packets.length} Wire Packets ▼`}
        </button>
      </div>
    </div>

    <!-- Real WASM Wire Packet Inspector for the Active Stage -->
    {#if showWireTable}
      <div class="px-4 sm:px-5 py-3 border-t border-white/10 bg-black/45">
        {#if currentStage.packets.length === 0}
          <div class="flex items-center justify-between gap-3 text-xs font-mono text-cyan-200/90 py-1">
            <span>
              🔒 {$locale === 'zh'
                ? '本步骤网络传输量 = 0 bytes（全部运算在各自设备本地内存完成，种子/私钥绝不上网）'
                : 'Network Traffic = 0 bytes in this step (100% local computation — seeds never touch the wire)'}
            </span>
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
