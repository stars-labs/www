#!/usr/bin/env bun
/**
 * Generate crisp, ultra-lightweight animated operation GIFs for all 36 Starlab
 * Wallet guide steps + 2 full-workflow Hero demo GIFs (Desktop & Extension).
 *
 * Uses variable per-frame delays + shared global colormap (+map) + delta
 * transparency optimization so every GIF looks sharp, plays smoothly, and stays
 * super lightweight (~60-220 KB) even on 4G mobile.
 *
 * Usage:
 *   bun run scripts/generate-guide-gifs.ts            # generate all 38 GIFs
 *   bun run scripts/generate-guide-gifs.ts ext-01     # generate only matching id(s)
 */

import { mkdir, rm, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  extensionShots,
  desktopShots,
  tuiShots,
  cliShots,
  type GuideShot,
} from "../src/lib/walletGuideData";

const ROOT = resolve(import.meta.dir, "..");
const OUT_DIR = join(ROOT, "public", "wallet-guide");

const TONE_HEX: Record<string, { stroke: string; fill: string }> = {
  accent: { stroke: "#ff4d6d", fill: "rgba(233,69,96,0.15)" },
  neon: { stroke: "#00f5ff", fill: "rgba(0,245,255,0.13)" },
  violet: { stroke: "#a78bfa", fill: "rgba(167,139,250,0.16)" },
};

let BOLD_FONT = "";

function targetWidth(device: GuideShot["device"]): number {
  switch (device) {
    case "extension":
      return 440;
    case "desktop":
      return 820;
    case "tui":
    case "cli":
      return 860;
  }
}

function easeInOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

async function runCmd(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) {
    throw new Error(`Command failed (${code}): ${cmd.join(" ")}\n${err}`);
  }
  return out.trim();
}

async function detectBoldFont(): Promise<string> {
  try {
    const f = await runCmd(["fc-match", "-f", "%{file}", "DejaVu Sans:bold"]);
    if (f) return f;
  } catch {}
  try {
    const f = await runCmd(["fc-match", "-f", "%{file}", "sans:bold"]);
    if (f) return f;
  } catch {}
  return "";
}

async function getDimensions(imgPath: string): Promise<{ w: number; h: number }> {
  const raw = await runCmd(["identify", "-format", "%w %h", imgPath]);
  const [w, h] = raw.split(/\s+/).map(Number);
  return { w, h };
}

/** Sleek macOS-style vector cursor arrow at (cx, cy). */
function cursorDrawArgs(cx: number, cy: number, pressed: boolean, scale = 1.0): string[] {
  const s = scale * (pressed ? 0.87 : 1.0);
  const pts: [number, number][] = [
    [0, 0],
    [0, 22],
    [5.5, 17],
    [9.5, 25],
    [13, 23.5],
    [9, 15.5],
    [15.5, 15.5],
  ];
  const shadowPoly = pts
    .map(([dx, dy]) => `${(cx + dx * s + 1.6).toFixed(1)},${(cy + dy * s + 2.0).toFixed(1)}`)
    .join(" ");
  const mainPoly = pts
    .map(([dx, dy]) => `${(cx + dx * s).toFixed(1)},${(cy + dy * s).toFixed(1)}`)
    .join(" ");

  return [
    "-fill", "rgba(0,0,0,0.45)",
    "-stroke", "none",
    "-draw", `polygon ${shadowPoly}`,
    "-fill", "#ffffff",
    "-stroke", "#0b0f19",
    "-strokewidth", (1.8 * scale).toFixed(1),
    "-draw", `polygon ${mainPoly}`,
  ];
}

function fontArgs(size: number): string[] {
  return BOLD_FONT
    ? ["-font", BOLD_FONT, "-pointsize", String(size)]
    : ["-pointsize", String(size)];
}

/** Draw active highlight box + numbered badge + optional click ripple + cursor + progress bar. */
function overlayArgs(opts: {
  W: number;
  H: number;
  box?: { x: number; y: number; w: number; h: number; tone: string; stepNum: number; pulse: number };
  ripple?: { cx: number; cy: number; radius: number; alpha: number; color: string };
  cursor?: { x: number; y: number; pressed: boolean };
  progress: number;
  accentColor: string;
}): string[] {
  const args: string[] = [];
  const { W, H, box, ripple, cursor, progress, accentColor } = opts;

  if (box) {
    const t = TONE_HEX[box.tone] || TONE_HEX.accent;
    const x1 = Math.max(2, (box.x / 100) * W);
    const y1 = Math.max(2, (box.y / 100) * H);
    const x2 = Math.min(W - 2, ((box.x + box.w) / 100) * W);
    const y2 = Math.min(H - 2, ((box.y + box.h) / 100) * H);
    const sw = (2.4 + box.pulse * 1.4).toFixed(1);

    args.push(
      "-fill", t.fill,
      "-stroke", t.stroke,
      "-strokewidth", sw,
      "-draw", `roundrectangle ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} 8,8`,
    );

    const br = Math.max(11, Math.min(13, Math.round(W * 0.017)));
    const bx = Math.max(br + 3, Math.min(W - br - 3, x1 + 2));
    const by = Math.max(br + 3, Math.min(H - br - 3, y1 + 2));
    const numStr = String(box.stepNum);
    const ptSize = Math.round(br * 1.25);

    args.push(
      "-fill", t.stroke,
      "-stroke", "#0b0f19",
      "-strokewidth", "2",
      "-draw", `circle ${bx.toFixed(1)},${by.toFixed(1)} ${(bx + br).toFixed(1)},${by.toFixed(1)}`,
      "-fill", box.tone === "neon" ? "#071019" : "#ffffff",
      "-stroke", "none",
      ...fontArgs(ptSize),
      "-gravity", "NorthWest",
      "-annotate", `+${Math.round(bx - br * 0.38)}+${Math.round(by - br * 0.62)}`,
      numStr,
    );
  }

  if (ripple && ripple.alpha > 0.02) {
    const r = ripple.radius;
    const hex = ripple.color;
    const rr = parseInt(hex.slice(1, 3), 16);
    const gg = parseInt(hex.slice(3, 5), 16);
    const bb = parseInt(hex.slice(5, 7), 16);
    const a1 = ripple.alpha.toFixed(2);
    const a2 = (ripple.alpha * 0.45).toFixed(2);
    args.push(
      "-fill", "none",
      "-stroke", `rgba(${rr},${gg},${bb},${a1})`,
      "-strokewidth", "3",
      "-draw", `circle ${ripple.cx.toFixed(1)},${ripple.cy.toFixed(1)} ${(ripple.cx + r).toFixed(1)},${ripple.cy.toFixed(1)}`,
      "-stroke", `rgba(${rr},${gg},${bb},${a2})`,
      "-strokewidth", "1.8",
      "-draw", `circle ${ripple.cx.toFixed(1)},${ripple.cy.toFixed(1)} ${(ripple.cx + r * 1.45).toFixed(1)},${ripple.cy.toFixed(1)}`,
    );
  }

  if (cursor) {
    const scale = W <= 500 ? 0.95 : 1.15;
    args.push(...cursorDrawArgs(cursor.x, cursor.y, cursor.pressed, scale));
  }

  const barH = 3;
  const barW = Math.max(4, Math.round(W * Math.max(0, Math.min(1, progress))));
  args.push(
    "-fill", "rgba(255,255,255,0.12)",
    "-stroke", "none",
    "-draw", `rectangle 0,${H - barH} ${W},${H}`,
    "-fill", accentColor,
    "-draw", `rectangle 0,${H - barH} ${barW},${H}`,
  );

  return args;
}

interface TimedFrame {
  path: string;
  /** Delay in centiseconds (10 = 100ms = 10fps, 55 = 550ms) */
  delayCs: number;
}

/**
 * Assemble timed PNG frames into a tiny, flicker-free GIF using:
 * - No per-frame random dither (+dither) so static UI pixels stay 100% identical
 * - Shared global palette (+map, 96 colors)
 * - ImageMagick -fuzz 2% -layers Optimize (delta rectangles + transparency)
 */
async function encodeTimedGif(frames: TimedFrame[], outGif: string, maxColors = 96) {
  const cmd: string[] = ["magick", "-loop", "0"];
  for (const f of frames) {
    cmd.push("-delay", String(f.delayCs), f.path);
  }
  cmd.push(
    "+dither",
    "-colors", String(maxColors),
    "-fuzz", "2%",
    "-layers", "Optimize",
    outGif,
  );
  await runCmd(cmd);
}

/** Generate one step GIF showing cursor glide -> click ripple -> hold -> next-step preview. */
async function generateStepGif(shot: GuideShot, nextShot: GuideShot | null, workRoot: string) {
  const stem = basename(shot.src).replace(/\.(webp|gif|png)$/i, "");
  const srcWebp = join(OUT_DIR, `${stem}.webp`);
  const outGif = join(OUT_DIR, `${stem}.gif`);
  const dir = join(workRoot, shot.id);
  await mkdir(dir, { recursive: true });

  const W = targetWidth(shot.device);
  const basePng = join(dir, "base.png");
  await runCmd(["magick", srcWebp, "-resize", `${W}x`, basePng]);
  const { w, h } = await getDimensions(basePng);

  let nextPng: string | null = null;
  if (nextShot) {
    const nextStem = basename(nextShot.src).replace(/\.(webp|gif|png)$/i, "");
    const nextWebp = join(OUT_DIR, `${nextStem}.webp`);
    nextPng = join(dir, "next.png");
    await runCmd([
      "magick", nextWebp,
      "-resize", `${w}x${h}`,
      "-background", "#0b0f19",
      "-gravity", "center",
      "-extent", `${w}x${h}`,
      nextPng,
    ]);
  }

  const callouts = shot.callouts.length > 0
    ? shot.callouts
    : [{ id: 1, x: 20, y: 40, w: 60, h: 20, tone: "accent" as const, labelEn: "", labelZh: "" }];

  const accentColor =
    shot.device === "extension"
      ? "#a78bfa"
      : shot.device === "tui"
        ? "#34d399"
        : shot.device === "cli"
          ? "#00f5ff"
          : "#ff4d6d";

  // 7 frames per callout: 3 glide (80ms) + 3 click-ripple (90ms) + 1 steady hold (550ms)
  // + optional 3 frames next-screen peek (110ms blend + 950ms hold + 110ms blend back)
  const framesPerCallout = 7;
  const peekCount = nextPng ? 3 : 0;
  const totalFrames = callouts.length * framesPerCallout + peekCount;

  const timed: TimedFrame[] = [];
  let frameIdx = 0;
  let prevX = w * 0.14;
  let prevY = h * 0.85;

  for (let ci = 0; ci < callouts.length; ci++) {
    const c = callouts[ci];
    const tone = c.tone || "accent";
    const tColor = (TONE_HEX[tone] || TONE_HEX.accent).stroke;
    const targetX = ((c.x + c.w * 0.52) / 100) * w;
    const targetY = ((c.y + c.h * 0.52) / 100) * h;

    for (let f = 0; f < framesPerCallout; f++) {
      const progress = (frameIdx + 1) / totalFrames;
      const outPath = join(dir, `frame_${String(frameIdx).padStart(3, "0")}.png`);

      let cx = targetX;
      let cy = targetY;
      let pressed = false;
      let pulse = 0;
      let delayCs = 8;
      let ripple: { cx: number; cy: number; radius: number; alpha: number; color: string } | undefined;

      if (f < 3) {
        const t = easeInOutCubic((f + 1) / 3);
        cx = prevX + (targetX - prevX) * t;
        cy = prevY + (targetY - prevY) * t;
        pulse = t * 0.45;
        delayCs = 8;
      } else if (f < 6) {
        const k = f - 3; // 0..2
        pressed = k === 0;
        pulse = 1 - k * 0.25;
        const maxR = Math.max(22, Math.min(40, w * 0.052));
        ripple = {
          cx: targetX,
          cy: targetY,
          radius: 8 + (k / 2) * maxR,
          alpha: Math.max(0.12, 0.92 - k * 0.34),
          color: tColor,
        };
        delayCs = 9;
      } else {
        pulse = 0.25;
        delayCs = 55;
      }

      await runCmd([
        "magick",
        basePng,
        ...overlayArgs({
          W: w,
          H: h,
          box: { x: c.x, y: c.y, w: c.w, h: c.h, tone, stepNum: c.id, pulse },
          ripple,
          cursor: { x: cx, y: cy, pressed },
          progress,
          accentColor,
        }),
        outPath,
      ]);
      timed.push({ path: outPath, delayCs });
      frameIdx++;
    }

    prevX = targetX;
    prevY = targetY;
  }

  if (nextPng) {
    // 1) Cross-fade into next screen
    const f1 = join(dir, `frame_${String(frameIdx++).padStart(3, "0")}.png`);
    await runCmd(["magick", "composite", "-blend", "50x50", nextPng, basePng, f1]);
    timed.push({ path: f1, delayCs: 11 });

    // 2) Crisp hold on next screen with bottom-right NEXT badge
    const f2 = join(dir, `frame_${String(frameIdx++).padStart(3, "0")}.png`);
    const badgeW = 90;
    const badgeH = 24;
    const bx1 = w - badgeW - 10;
    const by1 = h - badgeH - 10;
    await runCmd([
      "magick", nextPng,
      "-fill", "rgba(7,16,25,0.88)",
      "-stroke", accentColor,
      "-strokewidth", "1.6",
      "-draw", `roundrectangle ${bx1},${by1} ${w - 10},${h - 10} 10,10`,
      "-fill", "#ffffff",
      "-stroke", "none",
      ...fontArgs(12),
      "-gravity", "NorthWest",
      "-annotate", `+${bx1 + 12}+${by1 + 6}`,
      "NEXT ->",
      "-fill", accentColor,
      "-draw", `rectangle 0,${h - 3} ${w},${h}`,
      f2,
    ]);
    timed.push({ path: f2, delayCs: 95 });

    // 3) Smooth blend back to start
    const f3 = join(dir, `frame_${String(frameIdx++).padStart(3, "0")}.png`);
    await runCmd(["magick", "composite", "-blend", "45x55", nextPng, basePng, f3]);
    timed.push({ path: f3, delayCs: 11 });
  }

  await encodeTimedGif(timed, outGif, 96);
  const info = await stat(outGif);
  console.log(`  ✓ ${basename(outGif)} (${w}x${h}, ${timed.length}f, ${(info.size / 1024).toFixed(0)} KB)`);
}

/** Generate a multi-screen Hero Storyboard GIF for the top Hero section! */
async function generateHeroFlowGif(
  name: string,
  shots: GuideShot[],
  width: number,
  accentColor: string,
  workRoot: string,
) {
  const dir = join(workRoot, name);
  await mkdir(dir, { recursive: true });
  const outGif = join(OUT_DIR, `${name}.gif`);

  const firstStem = basename(shots[0].src).replace(/\.(webp|gif|png)$/i, "");
  const firstPng = join(dir, "slide_0.png");
  await runCmd(["magick", join(OUT_DIR, `${firstStem}.webp`), "-resize", `${width}x`, firstPng]);
  const { w, h } = await getDimensions(firstPng);

  const slides: string[] = [firstPng];
  for (let i = 1; i < shots.length; i++) {
    const stem = basename(shots[i].src).replace(/\.(webp|gif|png)$/i, "");
    const p = join(dir, `slide_${i}.png`);
    await runCmd([
      "magick", join(OUT_DIR, `${stem}.webp`),
      "-resize", `${w}x${h}`,
      "-background", "#0b0f19",
      "-gravity", "center",
      "-extent", `${w}x${h}`,
      p,
    ]);
    slides.push(p);
  }

  const timed: TimedFrame[] = [];
  let frameIdx = 0;
  const framesPerSlide = 6;
  const totalFrames = shots.length * framesPerSlide;

  for (let si = 0; si < shots.length; si++) {
    const shot = shots[si];
    const c = shot.callouts[shot.callouts.length - 1] || { id: 1, x: 20, y: 50, w: 60, h: 16, tone: "accent" };
    const tone = c.tone || "accent";
    const tColor = (TONE_HEX[tone] || TONE_HEX.accent).stroke;
    const tx = ((c.x + c.w * 0.5) / 100) * w;
    const ty = ((c.y + c.h * 0.5) / 100) * h;
    const sx = w * 0.2;
    const sy = h * 0.82;

    for (let f = 0; f < framesPerSlide; f++) {
      const progress = (frameIdx + 1) / totalFrames;
      const outPath = join(dir, `frame_${String(frameIdx).padStart(3, "0")}.png`);

      if (f === framesPerSlide - 1) {
        const nextSlide = slides[(si + 1) % slides.length];
        await runCmd(["magick", "composite", "-blend", "50x50", nextSlide, slides[si], outPath]);
        timed.push({ path: outPath, delayCs: 11 });
      } else {
        let cx = tx;
        let cy = ty;
        let pressed = false;
        let pulse = 0.4;
        let delayCs = 9;
        let ripple: { cx: number; cy: number; radius: number; alpha: number; color: string } | undefined;

        if (f < 2) {
          const t = easeInOutCubic((f + 1) / 2);
          cx = sx + (tx - sx) * t;
          cy = sy + (ty - sy) * t;
          pulse = t * 0.45;
          delayCs = 9;
        } else if (f < 4) {
          const k = f - 2;
          pressed = k === 0;
          pulse = 1 - k * 0.3;
          ripple = {
            cx: tx,
            cy: ty,
            radius: 8 + k * Math.min(28, w * 0.05),
            alpha: k === 0 ? 0.9 : 0.4,
            color: tColor,
          };
          delayCs = 10;
        } else {
          delayCs = 85;
        }

        await runCmd([
          "magick", slides[si],
          ...overlayArgs({
            W: w,
            H: h,
            box: { x: c.x, y: c.y, w: c.w, h: c.h, tone, stepNum: si + 1, pulse },
            ripple,
            cursor: { x: cx, y: cy, pressed },
            progress,
            accentColor,
          }),
          outPath,
        ]);
        timed.push({ path: outPath, delayCs });
      }
      frameIdx++;
    }
  }

  await encodeTimedGif(timed, outGif, 96);
  const info = await stat(outGif);
  console.log(`  ★ HERO ${basename(outGif)} (${w}x${h}, ${timed.length}f, ${(info.size / 1024).toFixed(0)} KB)`);
}

async function main() {
  BOLD_FONT = await detectBoldFont();
  console.log(`Using font: ${BOLD_FONT || "(default)"}`);

  const filter = process.argv.slice(2);
  const workRoot = join(tmpdir(), `starlab-gifs-${Date.now()}`);
  await mkdir(workRoot, { recursive: true });

  try {
    const groups: GuideShot[][] = [extensionShots, desktopShots, tuiShots, cliShots];
    const tasks: { shot: GuideShot; next: GuideShot | null }[] = [];

    for (const group of groups) {
      for (let i = 0; i < group.length; i++) {
        const shot = group[i];
        const next = i + 1 < group.length ? group[i + 1] : null;
        if (filter.length === 0 || filter.some((f) => shot.id.includes(f) || shot.src.includes(f))) {
          tasks.push({ shot, next });
        }
      }
    }

    console.log(`Generating ${tasks.length} animated step GIFs (concurrency = 6)...`);
    const CONCURRENCY = 6;
    let cursor = 0;
    async function worker() {
      while (cursor < tasks.length) {
        const idx = cursor++;
        const { shot, next } = tasks[idx];
        await generateStepGif(shot, next, workRoot);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, () => worker()));

    if (filter.length === 0 || filter.includes("hero")) {
      console.log("Generating 2 Hero full-workflow storyboard GIFs...");
      await Promise.all([
        generateHeroFlowGif(
          "hero-desktop-flow",
          [desktopShots[0], desktopShots[3], desktopShots[4], desktopShots[6], desktopShots[7], desktopShots[8], desktopShots[9]],
          800,
          "#ff4d6d",
          workRoot,
        ),
        generateHeroFlowGif(
          "hero-ext-flow",
          [extensionShots[0], extensionShots[1], extensionShots[4], extensionShots[6], extensionShots[7], extensionShots[8], extensionShots[11]],
          380,
          "#a78bfa",
          workRoot,
        ),
      ]);
    }
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
