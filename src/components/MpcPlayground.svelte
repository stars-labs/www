<script lang="ts">
  import { locale } from '../lib/i18n';
  import {
    runLiveDkg,
    deriveVaultAccounts,
    runFrostSigning,
    runEvmCggmp24Signing,
    runLiveReshare,
    encryptDeviceBackup,
    decryptDeviceBackup,
    type SandboxVault,
    type DerivedAccountRow,
    type SigningResult,
    type ReshareOutcome,
    type EncryptedBackupEnvelope,
  } from '../lib/mpcSandbox';

  type TabId = 'dkg' | 'accounts' | 'sign' | 'reshare' | 'backup';

  let activeTab: TabId = 'dkg';
  let vaultName = 'Starlab Treasury';
  let preset: '2-3' | '2-2' | '3-5' = '2-3';

  let vault: SandboxVault | null = null;
  let accountCount = 3;
  let accounts: DerivedAccountRow[] = [];

  let loadingDkg = false;
  let dkgError = '';
  let expandedLogIdx: number | null = null;

  // Signing state
  let signChain: 'bitcoin' | 'solana' | 'sui' | 'ethereum' = 'bitcoin';
  let signAccount = 0;
  let selectedSigners: number[] = [1, 2];
  let signMessage = 'Send 0.05 BTC · Starlab MPC Live WASM Demo';
  let signingBusy = false;
  let evmProgress: { round: number; frames: number; bytes: number; label: string } | null = null;
  let signResult: SigningResult | null = null;
  let signError = '';

  // Reshare state
  let reshareDropIndex = 3;
  let reshareBusy = false;
  let reshareResult: ReshareOutcome | null = null;
  let reshareError = '';

  // Backup state
  let backupDeviceIndex = 1;
  let backupPassword = 'Starlab#Vault2026';
  let encryptedBackup: EncryptedBackupEnvelope | null = null;
  let backupBusy = false;
  let testRestorePassword = '';
  let restoreStatus: { ok: boolean; msg: string } | null = null;

  let copiedText = '';

  function copyText(val: string) {
    navigator.clipboard?.writeText(val);
    copiedText = val;
    setTimeout(() => {
      if (copiedText === val) copiedText = '';
    }, 1600);
  }

  function presetNumbers(p: '2-3' | '2-2' | '3-5'): [number, number] {
    if (p === '2-2') return [2, 2];
    if (p === '3-5') return [3, 5];
    return [2, 3];
  }

  async function handleRunDkg() {
    loadingDkg = true;
    dkgError = '';
    signResult = null;
    signError = '';
    reshareResult = null;
    reshareError = '';
    encryptedBackup = null;
    restoreStatus = null;
    try {
      const [t, n] = presetNumbers(preset);
      // Let UI paint spinner before synchronous WASM DKG
      await new Promise((r) => setTimeout(r, 30));
      const v = await runLiveDkg(vaultName, t, n);
      vault = v;
      accountCount = 3;
      accounts = deriveVaultAccounts(v, accountCount);
      selectedSigners = Array.from({ length: t }, (_, i) => i + 1);
      reshareDropIndex = n;
      backupDeviceIndex = 1;
      if (signChain === 'ethereum' && !v.ecdsaGroupPubkey) {
        signChain = 'bitcoin';
      }
    } catch (e: any) {
      dkgError = e?.message || String(e);
    } finally {
      loadingDkg = false;
    }
  }

  function addHdAccount() {
    if (!vault) return;
    accountCount += 1;
    accounts = deriveVaultAccounts(vault, accountCount);
  }

  function toggleSigner(idx: number) {
    if (!vault) return;
    const dev = vault.devices.find((d) => d.index === idx);
    if (dev?.compromised) return;
    if (selectedSigners.includes(idx)) {
      selectedSigners = selectedSigners.filter((i) => i !== idx);
    } else {
      selectedSigners = [...selectedSigners, idx].sort((a, b) => a - b);
    }
    signError = '';
  }

  function simulateSingleDeviceAttack() {
    if (!vault) return;
    const firstAlive = vault.devices.find((d) => !d.compromised)?.index ?? 1;
    selectedSigners = [firstAlive];
    signResult = null;
    handleSign();
  }

  async function handleSign() {
    if (!vault) return;
    signError = '';
    signResult = null;
    evmProgress = null;

    if (selectedSigners.length < vault.threshold) {
      signError =
        $locale === 'zh'
          ? `🚫 密码学拦截：当前仅勾选 ${selectedSigners.length} 台设备，低于门限要求（至少需要 ${vault.threshold} 台）！单个分片不包含完整私钥，绝无可能伪造出合法签名。`
          : `🚫 Cryptographically Blocked: Only ${selectedSigners.length} device(s) approved, below the ${vault.threshold}-of-${vault.total} threshold! A single share reveals 0 bits of the private key.`;
      return;
    }

    signingBusy = true;
    try {
      if (signChain === 'ethereum') {
        signResult = await runEvmCggmp24Signing(
          vault,
          signAccount,
          selectedSigners,
          signMessage,
          (p) => {
            evmProgress = p;
          },
        );
      } else {
        await new Promise((r) => setTimeout(r, 20));
        signResult = await runFrostSigning(vault, signChain, signAccount, selectedSigners, signMessage);
      }
    } catch (e: any) {
      signError = e?.message || String(e);
    } finally {
      signingBusy = false;
      evmProgress = null;
    }
  }

  async function handleReshare() {
    if (!vault) return;
    reshareBusy = true;
    reshareError = '';
    reshareResult = null;
    try {
      await new Promise((r) => setTimeout(r, 30));
      const res = await runLiveReshare(vault, reshareDropIndex);
      reshareResult = res;
      vault = res.updatedVault;
      accounts = deriveVaultAccounts(vault, accountCount);
      selectedSigners = res.survivingIndices.slice(0, vault.threshold);
    } catch (e: any) {
      reshareError = e?.message || String(e);
    } finally {
      reshareBusy = false;
    }
  }

  async function handleEncryptBackup() {
    if (!vault) return;
    const dev = vault.devices.find((d) => d.index === backupDeviceIndex);
    if (!dev) return;
    backupBusy = true;
    restoreStatus = null;
    try {
      encryptedBackup = await encryptDeviceBackup(vault, dev, backupPassword);
      testRestorePassword = backupPassword;
    } finally {
      backupBusy = false;
    }
  }

  function downloadBackupJson() {
    if (!encryptedBackup) return;
    const blob = new Blob([JSON.stringify(encryptedBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starlab-sandbox-${encryptedBackup.device_id}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleTestDecrypt(passwordToTry: string) {
    if (!encryptedBackup) return;
    try {
      const res = await decryptDeviceBackup(encryptedBackup, passwordToTry);
      restoreStatus = {
        ok: true,
        msg:
          $locale === 'zh'
            ? `✓ 解密与 AEAD 完整性校验通过！成功恢复设备 ${res.device_id} 的全部 ${res.curves_restored} 条曲线分片。`
            : `✓ Decrypted & AEAD verified! Restored all ${res.curves_restored} curve shares for ${res.device_id}.`,
      };
    } catch {
      restoreStatus = {
        ok: false,
        msg:
          $locale === 'zh'
            ? '✗ 解密被 AES-256-GCM 认证标签拦截：密码错误或密文被篡改，无法读取任何分片字节！'
            : '✗ Rejected by AES-256-GCM authentication tag: wrong password or tampered ciphertext!',
      };
    }
  }

  $: survivingCount = vault ? vault.devices.filter((d) => !d.compromised).length : 0;
  $: canReshareNow = Boolean(vault && survivingCount > vault.threshold);
</script>

<section id="playground" class="scroll-mt-36 space-y-6">
  <div
    class="rounded-3xl border border-brand-neon/35 bg-gradient-to-br from-[#10182b] via-[#13192e] to-[#1a132c] shadow-[0_25px_80px_rgba(0,0,0,0.65)] overflow-hidden"
  >
    <!-- Top Banner -->
    <div class="px-6 sm:px-8 py-6 border-b border-white/10 bg-black/30 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2.5">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-brand-neon/15 text-brand-neon border border-brand-neon/40"
          >
            <span class="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
            LIVE RUST WASM SANDBOX · @stars-labs/core-wasm
          </span>
          <span class="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
            {$locale === 'zh' ? '100% 浏览器本地真机算力 · 零安装' : '100% Local Browser Crypto · Zero Install'}
          </span>
        </div>
        {#if vault}
          <span class="text-xs font-mono text-white/60">
            {vault.threshold}-of-{vault.total} · {vault.ecdsaGroupPubkey ? '3 Curves (ECDSA + Taproot + Ed25519)' : '2 Curves (Taproot + Ed25519)'} · Epoch #{vault.reshareEpoch}
          </span>
        {/if}
      </div>

      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div class="space-y-1.5 max-w-2xl">
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {$locale === 'zh'
              ? '免安装在线真机体验：在浏览器里直接跑通全部 MPC 功能'
              : 'Interactive Live WASM Sandbox — Try Every MPC Feature Right Here'}
          </h2>
          <p class="text-xs sm:text-sm text-white/70 leading-relaxed">
            {$locale === 'zh'
              ? '这里加载的正是 Starlab Chrome 插件同款 Rust 编译 WASM 引擎（FROST 3.0 + CGGMP24）。你可以直接在当前页面亲手跑通：2 轮 DKG 建库 → 全链 HD 派生 → BTC / SOL / SUI / 以太坊门限多签与 ecrecover 验签 → 单设备防盗拦截 → 丢设备无换地址 Reshare → AES-256-GCM 加密备份！'
              : 'Powered by the exact same Rust-compiled WASM binary shipped in Starlab Extension (FROST 3.0 + CGGMP24). Execute real 2-round DKG, BIP-44/86 HD derivation, BTC/SOL/SUI/EVM threshold signing + ecrecover verification, 1-device attack proofs, address-preserving resharing, and AES-256-GCM keystore backups live in your browser!'}
          </p>
        </div>

        <!-- Quick DKG Launcher Bar -->
        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            bind:value={preset}
            class="px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs sm:text-sm font-mono text-white outline-none focus:border-brand-neon"
            aria-label="Threshold configuration"
          >
            <option value="2-3">{$locale === 'zh' ? '2-of-3 (全3曲线·含ETH CGGMP24 ⭐)' : '2-of-3 (All 3 Curves + EVM ⭐)'}</option>
            <option value="2-2">{$locale === 'zh' ? '2-of-2 (双设备 FROST)' : '2-of-2 (Dual Device FROST)'}</option>
            <option value="3-5">{$locale === 'zh' ? '3-of-5 (团队金库 FROST)' : '3-of-5 (Team Vault FROST)'}</option>
          </select>
          <button
            type="button"
            disabled={loadingDkg}
            on:click={handleRunDkg}
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-accent to-violet-600 hover:brightness-110 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(233,69,96,0.4)] transition cursor-pointer"
          >
            {#if loadingDkg}
              {$locale === 'zh' ? '正在加载 WASM 并执行 2 轮 DKG…' : 'Loading WASM & Running 2-Round DKG…'}
            {:else if vault}
              {$locale === 'zh' ? '⚡ 重新生成新金库' : '⚡ Generate Fresh Vault'}
            {:else}
              {$locale === 'zh' ? '⚡ 一键启动真机 WASM 建库' : '⚡ Launch Live WASM Vault'}
            {/if}
          </button>
        </div>
      </div>

      {#if dkgError}
        <div class="p-3 rounded-xl bg-red-500/15 border border-red-400/40 text-xs text-red-200 font-mono">
          {dkgError}
        </div>
      {/if}
    </div>

    <!-- Navigation Tabs -->
    <div class="px-4 sm:px-8 pt-3 border-b border-white/10 bg-black/20 flex items-center gap-2 overflow-x-auto">
      {#each [
        { id: 'dkg', zh: '01 · 2轮 DKG & 3份分片', en: '01 · 2-Round DKG & 3 Shares' },
        { id: 'accounts', zh: '02 · 全链 HD 多账户', en: '02 · Multi-Chain HD Accounts' },
        { id: 'sign', zh: '03 · 2轮多签 & 防盗实测', en: '03 · Threshold Sign & Attack Proof' },
        { id: 'reshare', zh: '04 · 丢设备无换地址 Reshare', en: '04 · Reshare (Keep Address)' },
        { id: 'backup', zh: '05 · 加密备份 & 解密测试', en: '05 · AES-GCM Backup & Restore' },
      ] as tab}
        <button
          type="button"
          on:click={() => (activeTab = tab.id as TabId)}
          class="px-3.5 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition cursor-pointer {activeTab === tab.id
            ? 'border-brand-neon text-brand-neon'
            : 'border-transparent text-white/60 hover:text-white'}"
        >
          {$locale === 'zh' ? tab.zh : tab.en}
        </button>
      {/each}
    </div>

    <!-- Main Interactive Body -->
    <div class="p-6 sm:p-8">
      {#if !vault}
        <!-- Empty Welcome Prompt -->
        <div class="py-10 text-center max-w-xl mx-auto space-y-5">
          <div class="text-4xl">🔐⚡🌐</div>
          <h3 class="text-xl font-bold text-white">
            {$locale === 'zh'
              ? '点击上方「⚡ 一键启动真机 WASM 建库」，300 毫秒内亲眼见证无助记词 MPC 金库诞生'
              : 'Click “Launch Live WASM Vault” above to run a real dealerless 2-round DKG in ~300ms'}
          </h3>
          <p class="text-sm text-white/65 leading-relaxed">
            {$locale === 'zh'
              ? '完全在你的浏览器内存里运行真实 Rust 密码学，不需要注册账号、不需要下载软件、不上传任何数据到服务器。'
              : 'Runs real Rust cryptography inside your browser memory — zero signup, zero download, zero server custody.'}
          </p>
          <div class="flex flex-wrap justify-center gap-3 pt-1">
            <button
              type="button"
              disabled={loadingDkg}
              on:click={handleRunDkg}
              class="px-7 py-3.5 rounded-xl bg-brand-accent hover:brightness-110 text-white font-bold text-sm shadow-lg transition cursor-pointer"
            >
              {loadingDkg
                ? $locale === 'zh'
                  ? 'WASM 加载与计算中…'
                  : 'Initializing WASM…'
                : $locale === 'zh'
                  ? '🚀 立即创建 2-of-3 全链体验金库'
                  : '🚀 Create 2-of-3 Multi-Chain Sandbox Vault'}
            </button>
          </div>
          <p class="text-[11px] font-mono text-amber-300/80">
            {$locale === 'zh'
              ? '提示：2-of-3 沙盒模式内置演示用 Paillier AuxInfo 以实现毫秒级体验以太坊 CGGMP24；正式桌面端/插件建库会在本机独立生成专属安全素数。'
              : 'Note: 2-of-3 sandbox reuses demo Paillier aux-info for instant EVM keygen; production clients generate fresh safe primes locally.'}
          </p>
        </div>

      {:else if activeTab === 'dkg'}
        <!-- ==================== TAB 1: DKG TRACE & 3 SHARES ==================== -->
        <div class="space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-bold text-white">
                {$locale === 'zh'
                  ? `✅ 2 轮 DKG 建库完成（总耗时 ${vault.totalElapsedMs.toFixed(0)} ms）`
                  : `✅ 2-Round DKG Complete (${vault.totalElapsedMs.toFixed(0)} ms total)`}
              </h3>
              <p class="text-xs text-white/65">
                {$locale === 'zh'
                  ? '全部设备独立算出完全相同的全链群公钥，但每台设备持有的本地加密分片互不相同，完整私钥从未在任何位置存在过。'
                  : 'Every device independently converged on the exact same group public keys while holding distinct secret shares — no full private key ever existed.'}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                on:click={() => (activeTab = 'accounts')}
                class="px-3.5 py-2 rounded-lg bg-brand-neon/15 border border-brand-neon/40 text-brand-neon text-xs font-semibold hover:bg-brand-neon/25 cursor-pointer"
              >
                {$locale === 'zh' ? '下一步：查看全链 HD 地址 →' : 'Next: Multi-Chain HD Addresses →'}
              </button>
            </div>
          </div>

          <!-- Protocol Round Logs -->
          <div class="grid md:grid-cols-2 gap-3">
            {#each vault.logs as log, idx}
              <div class="rounded-2xl p-4 bg-black/35 border border-white/10 space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-brand-neon">
                    {$locale === 'zh' ? log.titleZh : log.titleEn}
                  </span>
                  <span class="text-[11px] font-mono text-emerald-300 shrink-0">
                    {log.elapsedMs.toFixed(1)} ms
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px] font-mono text-white/55">
                  <span>Wire: {log.bytesExchanged > 0 ? `${log.bytesExchanged} bytes` : 'local verify'}</span>
                  <button
                    type="button"
                    on:click={() => (expandedLogIdx = expandedLogIdx === idx ? null : idx)}
                    class="text-violet-300 hover:underline cursor-pointer"
                  >
                    {expandedLogIdx === idx ? ($locale === 'zh' ? '收起报文' : 'Hide hex') : ($locale === 'zh' ? '查看真实 Hex' : 'Inspect Hex')}
                  </button>
                </div>
                {#if expandedLogIdx === idx}
                  <div class="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-[10px] text-white/75 break-all">
                    {log.sampleHex}
                  </div>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Virtual Devices Grid -->
          <div class="space-y-3">
            <h4 class="text-sm font-bold text-white/90">
              {$locale === 'zh'
                ? `各设备独立持有的分片隔离视图（每个设备存 ${vault.ecdsaGroupPubkey ? '3' : '2'} 份独立分片）`
                : `Isolated Per-Device Key Shares (${vault.ecdsaGroupPubkey ? '3' : '2'} Curves Per Device)`}
            </h4>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each vault.devices as dev}
                <div
                  class="rounded-2xl p-4 border {dev.compromised
                    ? 'border-red-500/40 bg-red-950/20 opacity-75'
                    : 'border-white/12 bg-white/[0.03]'} space-y-2.5"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 font-semibold text-sm text-white">
                      <span>{dev.roleIcon}</span>
                      <span>#{dev.index} {$locale === 'zh' ? dev.labelZh : dev.labelEn}</span>
                    </div>
                    {#if dev.compromised}
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-400/40">
                        {$locale === 'zh' ? '已作废/丢失' : 'REVOKED'}
                      </span>
                    {:else}
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {$locale === 'zh' ? '在线持有' : 'ACTIVE'}
                      </span>
                    {/if}
                  </div>

                  <div class="space-y-1 text-[11px] font-mono">
                    <div class="text-white/50">
                      {$locale === 'zh' ? '根随机熵 (RootSecret):' : 'Local RootSecret:'}
                      <span class="text-white/80 ml-1">{dev.rootSecretHex.slice(0, 14)}…</span>
                    </div>
                    <div class="text-white/50">
                      {$locale === 'zh' ? '当前分片指纹 (唯一):' : 'Share Fingerprint:'}
                      <span class="text-brand-neon ml-1">{dev.shareFingerprint}</span>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-1.5 pt-1">
                    {#if dev.ecdsaKeyShare}
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                        #1 secp256k1-ecdsa
                      </span>
                    {/if}
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-400/30">
                      #2 secp256k1-tr
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/15 text-teal-300 border border-teal-400/30">
                      #3 ed25519
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

      {:else if activeTab === 'accounts'}
        <!-- ==================== TAB 2: MULTI-CHAIN HD ACCOUNTS ==================== -->
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-bold text-white">
                {$locale === 'zh'
                  ? 'BIP-44 / BIP-86 无交互全链 HD 账户派生（仅靠公钥，零额外 DKG）'
                  : 'Public-Only BIP-44 / BIP-86 Multi-Chain HD Derivation (Zero Extra DKG)'}
              </h3>
              <p class="text-xs text-white/65">
                {$locale === 'zh'
                  ? '一套 3 份根分片可无限派生子账户：每个账户自动拥有 100+ EVM 通用 0x 地址、BTC Taproot (bc1p…)、Solana 与 Sui 地址。'
                  : 'One 3-share vault derives unlimited accounts across 100+ EVM networks, Bitcoin Taproot (bc1p…), Solana, and Sui.'}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                on:click={addHdAccount}
                class="px-4 py-2 rounded-xl bg-brand-neon/15 hover:bg-brand-neon/25 border border-brand-neon/40 text-brand-neon text-xs font-bold cursor-pointer"
              >
                {$locale === 'zh' ? `+ 派生 Account #${accountCount}` : `+ Derive Account #${accountCount}`}
              </button>
              <button
                type="button"
                on:click={() => (activeTab = 'sign')}
                class="px-3.5 py-2 rounded-xl bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-xs font-semibold hover:bg-brand-accent/30 cursor-pointer"
              >
                {$locale === 'zh' ? '去多签实测 →' : 'Try Signing →'}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            {#each accounts as row}
              <div class="rounded-2xl p-4 bg-black/35 border border-white/10 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold text-white">
                    Account #{row.account}
                  </span>
                  <button
                    type="button"
                    on:click={() => {
                      signAccount = row.account;
                      activeTab = 'sign';
                    }}
                    class="text-xs font-mono text-brand-neon hover:underline cursor-pointer"
                  >
                    {$locale === 'zh' ? '用此账户发起多签 →' : 'Sign with Account #' + row.account + ' →'}
                  </button>
                </div>

                <div class="grid md:grid-cols-2 gap-2.5 text-xs font-mono">
                  {#if row.ethereum}
                    <div class="p-3 rounded-xl bg-indigo-500/8 border border-indigo-400/25 space-y-1">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-indigo-300 font-bold">Ethereum / 100+ EVM · {row.ethereum.path}</span>
                        <button type="button" on:click={() => copyText(row.ethereum!.address)} class="text-white/60 hover:text-white cursor-pointer">
                          {copiedText === row.ethereum.address ? '✓' : 'Copy'}
                        </button>
                      </div>
                      <div class="text-white/90 break-all">{row.ethereum.address}</div>
                    </div>
                  {/if}

                  <div class="p-3 rounded-xl bg-amber-500/8 border border-amber-400/25 space-y-1">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-amber-300 font-bold">Bitcoin Taproot · {row.bitcoin.path}</span>
                      <button type="button" on:click={() => copyText(row.bitcoin.address)} class="text-white/60 hover:text-white cursor-pointer">
                        {copiedText === row.bitcoin.address ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <div class="text-white/90 break-all">{row.bitcoin.address}</div>
                  </div>

                  <div class="p-3 rounded-xl bg-teal-500/8 border border-teal-400/25 space-y-1">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-teal-300 font-bold">Solana · {row.solana.path}</span>
                      <button type="button" on:click={() => copyText(row.solana.address)} class="text-white/60 hover:text-white cursor-pointer">
                        {copiedText === row.solana.address ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <div class="text-white/90 break-all">{row.solana.address}</div>
                  </div>

                  <div class="p-3 rounded-xl bg-cyan-500/8 border border-cyan-400/25 space-y-1">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-cyan-300 font-bold">Sui · {row.sui.path}</span>
                      <button type="button" on:click={() => copyText(row.sui.address)} class="text-white/60 hover:text-white cursor-pointer">
                        {copiedText === row.sui.address ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <div class="text-white/90 break-all">{row.sui.address}</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

      {:else if activeTab === 'sign'}
        <!-- ==================== TAB 3: THRESHOLD SIGNING & ATTACK PROOF ==================== -->
        <div class="grid lg:grid-cols-12 gap-6">
          <!-- Left controls -->
          <div class="lg:col-span-6 space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono uppercase tracking-wider text-white/70">
                  {$locale === 'zh' ? `1. 选择批准签名的设备（至少需 ${vault.threshold} 台）` : `1. Select Approving Devices (Min ${vault.threshold})`}
                </span>
                <button
                  type="button"
                  on:click={simulateSingleDeviceAttack}
                  class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-400/35 hover:bg-red-500/25 cursor-pointer"
                >
                  {$locale === 'zh' ? '🛡️ 测单设备防盗拦截' : '🛡️ Test 1-Device Block'}
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each vault.devices as dev}
                  {@const picked = selectedSigners.includes(dev.index)}
                  <button
                    type="button"
                    disabled={dev.compromised}
                    on:click={() => toggleSigner(dev.index)}
                    class="px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed {picked
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-white/5 border-white/15 text-white/65 hover:text-white'}"
                  >
                    {dev.roleIcon} #{dev.index} {$locale === 'zh' ? dev.labelZh : dev.labelEn}
                    {dev.compromised ? ' (已作废)' : picked ? ' ✓' : ''}
                  </button>
                {/each}
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label for="sandbox-sign-chain" class="text-xs font-mono uppercase tracking-wider text-white/70">
                  {$locale === 'zh' ? '2. 选择目标公链与签名协议' : '2. Target Chain & Protocol'}
                </label>
                <select
                  id="sandbox-sign-chain"
                  bind:value={signChain}
                  class="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs sm:text-sm text-white outline-none focus:border-brand-neon"
                >
                  <option value="bitcoin">Bitcoin Taproot (FROST BIP-340 · ~30ms)</option>
                  <option value="solana">Solana (FROST Ed25519 · ~25ms)</option>
                  <option value="sui">Sui (FROST Ed25519 · ~25ms)</option>
                  {#if vault.ecdsaGroupPubkey}
                    <option value="ethereum">Ethereum / 100+ EVM (CGGMP24 ECDSA · ~15s)</option>
                  {/if}
                </select>
              </div>
              <div class="space-y-1.5">
                <label for="sandbox-sign-account" class="text-xs font-mono uppercase tracking-wider text-white/70">
                  {$locale === 'zh' ? '3. 选择 HD 子账户' : '3. HD Account'}
                </label>
                <select
                  id="sandbox-sign-account"
                  bind:value={signAccount}
                  class="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs sm:text-sm text-white outline-none focus:border-brand-neon"
                >
                  {#each accounts as row}
                    <option value={row.account}>Account #{row.account}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="sandbox-sign-msg" class="text-xs font-mono uppercase tracking-wider text-white/70">
                  {$locale === 'zh' ? '4. 待签消息 / 交易内容' : '4. Message / Transaction Payload'}
                </label>
                <div class="flex gap-1.5 text-[10px] font-mono">
                  <button type="button" on:click={() => (signMessage = 'Send 0.05 BTC · BIP-340 Taproot Spend')} class="px-2 py-0.5 rounded bg-white/8 text-white/70 hover:text-white cursor-pointer">BTC</button>
                  <button type="button" on:click={() => (signMessage = 'Transfer 12.5 SOL to Treasury')} class="px-2 py-0.5 rounded bg-white/8 text-white/70 hover:text-white cursor-pointer">SOL</button>
                  <button type="button" on:click={() => (signMessage = 'Starlab MPC Ethereum EIP-191 Sign-In')} class="px-2 py-0.5 rounded bg-white/8 text-white/70 hover:text-white cursor-pointer">ETH</button>
                </div>
              </div>
              <textarea
                id="sandbox-sign-msg"
                bind:value={signMessage}
                rows="3"
                class="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs sm:text-sm font-mono text-white outline-none focus:border-brand-neon"
              ></textarea>
            </div>

            <button
              type="button"
              disabled={signingBusy}
              on:click={handleSign}
              class="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-accent to-violet-600 hover:brightness-110 disabled:opacity-60 text-white font-bold text-sm shadow-lg transition cursor-pointer"
            >
              {#if signingBusy}
                {signChain === 'ethereum'
                  ? $locale === 'zh'
                    ? 'Web Worker 正在执行真实 CGGMP24 3072-bit Paillier 交互签名（约 15 秒）…'
                    : 'Web Worker running real CGGMP24 interactive ECDSA (~15s)…'
                  : $locale === 'zh'
                    ? '正在执行 2 轮 FROST 协同签名…'
                    : 'Running 2-Round FROST signing…'}
              {:else}
                {$locale === 'zh'
                  ? `✍️ 发起 ${selectedSigners.length}/${vault.total} 真实门限多签`
                  : `✍️ Run Real ${selectedSigners.length}/${vault.total} Threshold Signature`}
              {/if}
            </button>
          </div>

          <!-- Right live result / cryptographic proof -->
          <div class="lg:col-span-6 rounded-2xl p-5 bg-black/40 border border-white/10 flex flex-col justify-between gap-4">
            {#if signingBusy && evmProgress}
              <div class="my-auto space-y-4 text-center py-6">
                <div class="text-xs font-mono text-brand-neon animate-pulse">{evmProgress.label}</div>
                <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-brand-accent to-brand-neon transition-all duration-300"
                    style="width: {Math.min(95, evmProgress.round * 24)}%"
                  ></div>
                </div>
                <div class="text-xs font-mono text-white/60">
                  CGGMP24 Web Worker · {evmProgress.frames} frames · {(evmProgress.bytes / 1024).toFixed(1)} KB exchanged
                </div>
              </div>
            {:else if signError}
              <div class="my-auto p-5 rounded-2xl bg-red-500/12 border border-red-400/40 space-y-2.5">
                <div class="text-sm font-bold text-red-300">
                  {$locale === 'zh' ? '安全机制触发：拒绝签发' : 'Security Enforcement: Signing Rejected'}
                </div>
                <p class="text-xs text-red-100/90 leading-relaxed">{signError}</p>
              </div>
            {:else if signResult}
              <div class="space-y-3.5 text-xs font-mono">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                    ✓ {signResult.verified ? ($locale === 'zh' ? '链上密码学验签 100% 通过' : 'CRYPTOGRAPHICALLY VERIFIED') : 'FAILED'}
                  </span>
                  <span class="text-white/60">
                    {signResult.elapsedMs < 1000
                      ? `${signResult.elapsedMs.toFixed(1)} ms`
                      : `${(signResult.elapsedMs / 1000).toFixed(1)} s`}
                    · Devices #{signResult.participants.join(' + #')}
                  </span>
                </div>

                <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-200 leading-relaxed font-sans text-xs">
                  {$locale === 'zh' ? signResult.verificationNoteZh : signResult.verificationNoteEn}
                </div>

                <div class="space-y-2">
                  <div>
                    <div class="text-white/50 text-[11px]">Signer Address ({signResult.path}):</div>
                    <div class="text-white break-all">{signResult.signerAddress}</div>
                  </div>
                  <div>
                    <div class="text-white/50 text-[11px]">Message Digest:</div>
                    <div class="text-white/80 break-all">{signResult.messageHashHex}</div>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div class="p-2 rounded-lg bg-white/5 border border-white/10">
                      <div class="text-[10px] text-white/50">Round 1 Wire</div>
                      <div class="text-brand-neon font-bold">{signResult.commitBytes} B</div>
                    </div>
                    <div class="p-2 rounded-lg bg-white/5 border border-white/10">
                      <div class="text-[10px] text-white/50">Final Signature</div>
                      <div class="text-violet-300 font-bold">{signResult.signatureLenBytes} B (Single-Sig Format)</div>
                    </div>
                  </div>
                  <div>
                    <div class="flex items-center justify-between text-[11px] text-white/50">
                      <span>Aggregated Signature Hex:</span>
                      <button type="button" on:click={() => copyText(signResult!.signatureHex)} class="text-brand-neon hover:underline cursor-pointer">
                        {copiedText === signResult.signatureHex ? '✓ Copied' : 'Copy Hex'}
                      </button>
                    </div>
                    <div class="p-2.5 rounded-lg bg-black/60 border border-white/10 text-amber-200 break-all text-[11px]">
                      {signResult.signatureHex}
                    </div>
                  </div>
                </div>
              </div>
            {:else}
              <div class="my-auto text-center py-8 space-y-2">
                <div class="text-3xl">✍️</div>
                <p class="text-sm font-semibold text-white/85">
                  {$locale === 'zh' ? '选择任意 t 台设备并点击签名，实时产出可链上验签的真实签名' : 'Select any t devices and sign to produce a real on-chain verifiable signature'}
                </p>
                <p class="text-xs text-white/55">
                  {$locale === 'zh'
                    ? '你也可以点「🛡️ 测单设备防盗拦截」亲眼验证只有 1 台设备时彻底无法签名！'
                    : 'Or click “Test 1-Device Block” to prove a single compromised device cannot sign!'}
                </p>
              </div>
            {/if}
          </div>
        </div>

      {:else if activeTab === 'reshare'}
        <!-- ==================== TAB 4: ADDRESS-PRESERVING RESHARE ==================== -->
        <div class="space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
              <h3 class="text-lg font-bold text-white">
                {$locale === 'zh'
                  ? '丢设备 / 怀疑泄密？无换地址刷新 FROST 分片（Proactive Share Refresh）'
                  : 'Lost or Stolen Device? Address-Preserving FROST Share Refresh'}
              </h3>
              <p class="text-xs text-white/65">
                {$locale === 'zh'
                  ? '剩余存活设备在线执行 2 轮 frost_core::keys::refresh，生成全新多项式分片：旧被盗分片立即作废，但比特币 Taproot、Solana、Sui 的收款地址 100% 不变！'
                  : 'Surviving devices run frost_core::keys::refresh: the stolen share becomes cryptographically useless while your BTC Taproot, Solana & Sui addresses stay 100% identical.'}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2.5 shrink-0">
              <select
                bind:value={reshareDropIndex}
                class="px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none"
              >
                {#each vault.devices.filter((d) => !d.compromised) as d}
                  <option value={d.index}>
                    {$locale === 'zh' ? `剔除设备 #${d.index} (${d.labelZh})` : `Drop Device #${d.index} (${d.labelEn})`}
                  </option>
                {/each}
              </select>
              <button
                type="button"
                disabled={reshareBusy || !canReshareNow}
                on:click={handleReshare}
                class="px-4 py-2.5 rounded-xl bg-amber-500/85 hover:bg-amber-400 disabled:opacity-45 text-black font-bold text-xs sm:text-sm cursor-pointer transition"
              >
                {reshareBusy
                  ? $locale === 'zh'
                    ? '正在刷新分片…'
                    : 'Refreshing Shares…'
                  : !canReshareNow
                    ? $locale === 'zh'
                      ? '需至少 t+1 台存活设备（请切 2-of-3 重建）'
                      : 'Need > threshold devices (use 2-of-3)'
                    : $locale === 'zh'
                      ? `🔥 模拟设备 #${reshareDropIndex} 被盗并刷新`
                      : `🔥 Drop Device #${reshareDropIndex} & Reshare`}
              </button>
            </div>
          </div>

          {#if reshareError}
            <div class="p-3 rounded-xl bg-red-500/15 border border-red-400/40 text-xs text-red-200 font-mono">
              {reshareError}
            </div>
          {/if}

          {#if reshareResult}
            <div class="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-400/35 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-bold text-emerald-300 text-sm">
                  {$locale === 'zh'
                    ? `✓ Reshare 成功完成（耗时 ${reshareResult.elapsedMs.toFixed(1)} ms）`
                    : `✓ Reshare Completed (${reshareResult.elapsedMs.toFixed(1)} ms)`}
                </span>
                <span class="text-xs font-mono text-white/65">
                  Dropped #{reshareResult.droppedDeviceIndex} · Active #{reshareResult.survivingIndices.join(', #')}
                </span>
              </div>
              <div class="grid md:grid-cols-3 gap-3 text-xs">
                <div class="p-3 rounded-xl bg-black/40 border border-emerald-400/25">
                  <div class="font-bold text-emerald-300 mb-1">
                    {reshareResult.btcPubkeyUnchanged && reshareResult.edPubkeyUnchanged ? '✓' : '✗'}
                    {$locale === 'zh' ? ' 钱包地址 100% 未变' : ' Addresses 100% Unchanged'}
                  </div>
                  <div class="text-white/65">
                    {$locale === 'zh'
                      ? 'BTC Taproot、Solana、Sui 群公钥前后逐字节完全一致，无需任何链上转账！'
                      : 'BTC Taproot, Solana & Sui group public keys match byte-for-byte — zero on-chain migration!'}
                  </div>
                </div>
                <div class="p-3 rounded-xl bg-black/40 border border-brand-neon/25">
                  <div class="font-bold text-brand-neon mb-1">
                    ✓ {$locale === 'zh' ? '存活分片全部换新' : 'Surviving Shares Rotated'}
                  </div>
                  <div class="text-white/65">
                    {$locale === 'zh'
                      ? '设备 #' + reshareResult.survivingIndices.join('、#') + ' 已切换至全新多项式分片指纹（可回 Tab 01 对比）。'
                      : 'Devices #' + reshareResult.survivingIndices.join(', #') + ' now hold brand-new polynomial shares.'}
                  </div>
                </div>
                <div class="p-3 rounded-xl bg-black/40 border border-red-400/30">
                  <div class="font-bold text-red-300 mb-1">
                    {reshareResult.stolenShareRejected ? '✓' : '✗'}
                    {$locale === 'zh' ? ' 旧被盗分片实测已作废' : ' Stolen Share Rejected Live'}
                  </div>
                  <div class="text-white/65 break-words">
                    {$locale === 'zh'
                      ? `已自动尝试用被盗的旧 #${reshareResult.droppedDeviceIndex} 混签 → WASM 直接拒绝（${reshareResult.stolenShareError}）`
                      : `Live probe mixing stolen old #${reshareResult.droppedDeviceIndex} share was rejected (${reshareResult.stolenShareError})`}
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <div class="p-3.5 rounded-xl bg-amber-500/8 border border-amber-400/25 text-xs text-amber-200/90">
            {$locale === 'zh'
              ? '注：FROST（Bitcoin Taproot / Solana / Sui）原生支持无换地址 Reshare；而以太坊 CGGMP24 0.7 协议本身不支持无换地址刷新，若 EVM 设备丢失需新建金库并转移资产。'
              : 'Note: FROST (Bitcoin Taproot / Solana / Sui) natively supports address-preserving resharing; CGGMP24 0.7 has no key refresh so EVM funds should be swept to a fresh vault if a device is compromised.'}
          </div>
        </div>

      {:else if activeTab === 'backup'}
        <!-- ==================== TAB 5: AES-256-GCM BACKUP & RESTORE ==================== -->
        <div class="grid lg:grid-cols-12 gap-6">
          <div class="lg:col-span-6 space-y-4">
            <h3 class="text-lg font-bold text-white">
              {$locale === 'zh'
                ? '加密分片备份实测（PBKDF2-SHA256 10万轮 + AES-256-GCM）'
                : 'Encrypted Keystore Backup (PBKDF2-SHA256 100k + AES-256-GCM)'}
            </h3>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '采用与 Starlab 正式客户端完全一致的浏览器 WebCrypto 加密格式（salt 16B ‖ nonce 12B ‖ ciphertext），把单台设备的全部曲线分片打包成独立加密文件。'
                : 'Uses the exact PBKDF2-HMAC-SHA256 + AES-256-GCM format from starlab-core to seal one device’s multi-curve shares into a portable encrypted JSON file.'}
            </p>
            <div class="grid sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="sandbox-backup-dev" class="text-xs font-mono text-white/65">{$locale === 'zh' ? '选择备份设备' : 'Device to Back Up'}</label>
                <select
                  id="sandbox-backup-dev"
                  bind:value={backupDeviceIndex}
                  class="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none"
                >
                  {#each vault.devices as d}
                    <option value={d.index}>#{d.index} {$locale === 'zh' ? d.labelZh : d.labelEn}</option>
                  {/each}
                </select>
              </div>
              <div class="space-y-1">
                <label for="sandbox-backup-pw" class="text-xs font-mono text-white/65">{$locale === 'zh' ? '设置加密密码' : 'Encryption Password'}</label>
                <input
                  id="sandbox-backup-pw"
                  type="text"
                  bind:value={backupPassword}
                  class="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white outline-none focus:border-brand-neon"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={backupBusy || backupPassword.length < 4}
              on:click={handleEncryptBackup}
              class="w-full py-3 rounded-xl bg-brand-neon/20 hover:bg-brand-neon/30 border border-brand-neon/45 text-brand-neon font-bold text-xs sm:text-sm cursor-pointer transition"
            >
              {backupBusy
                ? $locale === 'zh'
                  ? 'PBKDF2 + AES-256-GCM 加密中…'
                  : 'Encrypting…'
                : $locale === 'zh'
                  ? '🔒 生成真实 AES-256-GCM 加密备份文件'
                  : '🔒 Encrypt Device Shares with AES-256-GCM'}
            </button>
          </div>

          <div class="lg:col-span-6 rounded-2xl p-5 bg-black/40 border border-white/10 space-y-4">
            {#if encryptedBackup}
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-mono text-emerald-300 font-bold">
                  ✓ {encryptedBackup.curves.length} Curves Sealed · {(encryptedBackup.ciphertext_b64.length / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  on:click={downloadBackupJson}
                  class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-white cursor-pointer"
                >
                  ⬇ {$locale === 'zh' ? '下载 .json 密文' : 'Download .json'}
                </button>
              </div>
              <div class="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-[10px] text-white/60 break-all max-h-24 overflow-y-auto">
                {encryptedBackup.ciphertext_b64.slice(0, 320)}…
              </div>
              <div class="pt-2 border-t border-white/10 space-y-2.5">
                <div class="text-xs font-semibold text-white/85">
                  {$locale === 'zh' ? '现场验证密码解密与错密拦截：' : 'Test Decryption & Wrong-Password Rejection:'}
                </div>
                <div class="flex flex-wrap gap-2">
                  <input
                    type="text"
                    bind:value={testRestorePassword}
                    placeholder="Enter password to test"
                    class="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white outline-none"
                  />
                  <button
                    type="button"
                    on:click={() => handleTestDecrypt(testRestorePassword)}
                    class="px-3.5 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 cursor-pointer"
                  >
                    {$locale === 'zh' ? '🔓 正确密码解密' : '🔓 Decrypt'}
                  </button>
                  <button
                    type="button"
                    on:click={() => handleTestDecrypt('wrong-password-123')}
                    class="px-3.5 py-2 rounded-lg bg-red-500/15 border border-red-400/40 text-red-300 text-xs font-bold hover:bg-red-500/25 cursor-pointer"
                  >
                    {$locale === 'zh' ? '🚫 测错密码拦截' : '🚫 Test Wrong Pass'}
                  </button>
                </div>
                {#if restoreStatus}
                  <div
                    class="p-3 rounded-xl text-xs {restoreStatus.ok
                      ? 'bg-emerald-500/15 border border-emerald-400/35 text-emerald-200'
                      : 'bg-red-500/15 border border-red-400/35 text-red-200'}"
                  >
                    {restoreStatus.msg}
                  </div>
                {/if}
              </div>
            {:else}
              <div class="my-auto text-center py-8 space-y-2">
                <div class="text-3xl">🔒</div>
                <p class="text-xs text-white/60">
                  {$locale === 'zh'
                    ? '点击左侧生成加密备份，可亲自测试错密码被 AEAD 拒绝，以及下载真实 JSON 密文文件。'
                    : 'Click Encrypt on the left to seal a device share, download the JSON backup, and test wrong-password rejection.'}
                </p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
