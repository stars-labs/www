/**
 * Dedicated Web Worker for CPU-intensive CGGMP24 Threshold ECDSA signing in WASM.
 * Keeps the main browser UI at 60fps while executing real 3072-bit Paillier MtA
 * interactive rounds across simulated co-signing devices.
 */
import init, * as wasm from "./wasm/starlab_core_wasm.js";

let ready: Promise<void> | null = null;

function ensureInit(): Promise<void> {
  if (!ready) {
    ready = init({ module_or_path: "/wasm/starlab_core_wasm_bg.wasm" }).then(() => {});
  }
  return ready;
}

export interface EcdsaSignWorkerRequest {
  type: "sign";
  sessionId: string;
  shares: string[];
  signerIndices: number[];
  path: string;
  prehash: number[];
}

export type EcdsaSignWorkerResponse =
  | { type: "progress"; round: number; frames: number; bytes: number; label: string }
  | {
      type: "done";
      signatureHex: string;
      recoveredAddress: string;
      elapsedMs: number;
      frames: number;
      bytes: number;
    }
  | { type: "error"; message: string };

self.onmessage = async (ev: MessageEvent<EcdsaSignWorkerRequest>) => {
  const req = ev.data;
  if (req.type !== "sign") return;

  try {
    await ensureInit();
    const t0 = performance.now();
    const prehash = new Uint8Array(req.prehash);
    const signers = new Uint16Array(req.signerIndices);
    const parties = req.signerIndices.map(
      (partyIdx) =>
        new wasm.EcdsaSigning(req.sessionId, req.shares[partyIdx], signers, req.path, prehash),
    );

    const outs: (string | undefined)[] = req.signerIndices.map(() => undefined);
    let frames = 0;
    let bytes = 0;

    const roundLabels = [
      "Round 1 · MtA Paillier Commitments",
      "Round 2 · Zero-Knowledge Range Proofs",
      "Round 3 · Presign & Nonce Verification",
      "Round 4 · Partial Signature & Aggregation",
    ];

    for (let step = 0; step < 60 && outs.some((x) => !x); step++) {
      let progressed = false;
      for (let k = 0; k < parties.length; k++) {
        const partyIdx = req.signerIndices[k];
        if (!outs[k]) {
          const r = parties[k].proceed();
          if (r) {
            outs[k] = r;
            progressed = true;
          }
        }
        const outgoing = parties[k].take_outgoing();
        for (const msg of outgoing) {
          progressed = true;
          const payload =
            msg.payload instanceof Uint8Array ? msg.payload : new Uint8Array(msg.payload);
          frames++;
          bytes += payload.byteLength;
          if (msg.recipient === "broadcast") {
            for (let m = 0; m < parties.length; m++) {
              if (m !== k) parties[m].receive(partyIdx, payload);
            }
          } else {
            const dest = req.signerIndices.indexOf(Number(msg.recipient));
            if (dest >= 0) parties[dest].receive(partyIdx, payload);
          }
        }
      }

      const roundIdx = Math.min(roundLabels.length - 1, Math.floor(step / 2));
      self.postMessage({
        type: "progress",
        round: roundIdx + 1,
        frames,
        bytes,
        label: roundLabels[roundIdx],
      } satisfies EcdsaSignWorkerResponse);

      if (!progressed && outs.every((x) => Boolean(x))) break;
    }

    for (const p of parties) p.free();

    const signatureHex = outs[0];
    if (!signatureHex) {
      throw new Error("CGGMP24 signing did not produce a signature");
    }
    const sigBytes = new Uint8Array(
      signatureHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
    );
    const recoveredAddress = wasm.ecdsa_recover_ethereum_address(prehash, sigBytes);

    self.postMessage({
      type: "done",
      signatureHex,
      recoveredAddress,
      elapsedMs: performance.now() - t0,
      frames,
      bytes,
    } satisfies EcdsaSignWorkerResponse);
  } catch (err: any) {
    self.postMessage({
      type: "error",
      message: err?.message || String(err),
    } satisfies EcdsaSignWorkerResponse);
  }
};
