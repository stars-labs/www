/* tslint:disable */
/* eslint-disable */

/**
 * Aux-info ceremony (Paillier moduli + ZK proofs) — the slow one.
 */
export class EcdsaAuxInfo {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Hex execution id (also bytes 3..35 of every payload).
     */
    execution_id(): string;
    /**
     * Our keygen index.
     */
    index(): number;
    is_finished(): boolean;
    /**
     * `participants`: sorted device ids (position = keygen index);
     * `index`: ours; `primes_json`: from [`ecdsa_primes_from_parts`].
     */
    constructor(session_id: string, participants: string[], index: number, primes_json: string);
    /**
     * Keygen indices of all parties (us included).
     */
    parties(): Uint16Array;
    /**
     * Advance; returns the aux-info JSON (secret) once finished, else
     * undefined. Throws if the protocol aborts.
     */
    proceed(): string | undefined;
    /**
     * Queue a payload from party `sender` (keygen index). Throws on a
     * payload of another execution, from a non-party, or
     * undecodable — the ceremony's state is unchanged then, so a
     * caller may log and drop it. Exact duplicates are ignored.
     */
    receive(sender: number, payload: Uint8Array): void;
    /**
     * Drain the messages to send (production order).
     */
    take_outgoing(): Array<any>;
}

/**
 * Threshold keygen ceremony.
 */
export class EcdsaKeygen {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Hex execution id (also bytes 3..35 of every payload).
     */
    execution_id(): string;
    /**
     * Our keygen index.
     */
    index(): number;
    is_finished(): boolean;
    constructor(session_id: string, participants: string[], index: number, threshold: number);
    /**
     * Keygen indices of all parties (us included).
     */
    parties(): Uint16Array;
    /**
     * Advance; returns the keygen output JSON (secret; join it with the
     * aux info via [`ecdsa_key_share_from_parts`]) once finished.
     */
    proceed(): string | undefined;
    /**
     * Queue a payload from party `sender` (keygen index). Throws on a
     * payload of another execution, from a non-party, or
     * undecodable — the ceremony's state is unchanged then, so a
     * caller may log and drop it. Exact duplicates are ignored.
     */
    receive(sender: number, payload: Uint8Array): void;
    /**
     * Drain the messages to send (production order).
     */
    take_outgoing(): Array<any>;
}

/**
 * One signing (full interactive protocol — no presignatures).
 */
export class EcdsaSigning {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Hex execution id (also bytes 3..35 of every payload).
     */
    execution_id(): string;
    /**
     * Our keygen index.
     */
    index(): number;
    is_finished(): boolean;
    /**
     * Sign the 32-byte `prehash` with the HD child at `path` (e.g.
     * "m/44'/60'/0'/0/0") together with `signers` (keygen indices, exactly
     * the share's threshold, us included). `session_id` must be fresh per
     * signing (`sign_<uuid>`).
     */
    constructor(session_id: string, share_json: string, signers: Uint16Array, path: string, prehash: Uint8Array);
    /**
     * Keygen indices of all parties (us included).
     */
    parties(): Uint16Array;
    /**
     * Advance; once finished returns hex of the 65-byte `r ‖ s ‖ v`
     * (low-s, `v = 27 + recovery_id` — personal_sign's convention; a typed
     * transaction takes `y_parity = v - 27`), else undefined.
     */
    proceed(): string | undefined;
    /**
     * Queue a payload from party `sender` (keygen index). Throws on a
     * payload of another execution, from a non-party, or
     * undecodable — the ceremony's state is unchanged then, so a
     * caller may log and drop it. Exact duplicates are ignored.
     */
    receive(sender: number, payload: Uint8Array): void;
    /**
     * Drain the messages to send (production order).
     */
    take_outgoing(): Array<any>;
}

export class FrostDkgEd25519 {
    free(): void;
    [Symbol.dispose](): void;
    add_round1_package(participant_index: number, package_hex: string): void;
    add_round2_package(sender_index: number, package_hex: string): void;
    add_signature_share(participant_index: number, share_hex: string): void;
    add_signing_commitment(participant_index: number, commitment_hex: string): void;
    aggregate_signature(message_hex: string): string;
    can_finalize(): boolean;
    can_start_round2(): boolean;
    clear_signing_state(): void;
    export_keystore(): string;
    finalize_dkg(): string;
    generate_round1(): string;
    generate_round2(): string;
    get_address(): string;
    get_group_public_key(): string;
    has_signing_nonces(): boolean;
    import_keystore(keystore_json: string): void;
    init_dkg(participant_index: number, total: number, threshold: number): void;
    is_dkg_complete(): boolean;
    constructor();
    sign(message_hex: string): string;
    signing_commit(): string;
}

export class FrostDkgSecp256k1 {
    free(): void;
    [Symbol.dispose](): void;
    add_round1_package(participant_index: number, package_hex: string): void;
    add_round2_package(sender_index: number, package_hex: string): void;
    add_signature_share(participant_index: number, share_hex: string): void;
    add_signing_commitment(participant_index: number, commitment_hex: string): void;
    aggregate_signature(message_hex: string): string;
    can_finalize(): boolean;
    can_start_round2(): boolean;
    clear_signing_state(): void;
    export_keystore(): string;
    finalize_dkg(): string;
    generate_round1(): string;
    generate_round2(): string;
    get_address(): string;
    get_group_public_key(): string;
    has_signing_nonces(): boolean;
    import_keystore(keystore_json: string): void;
    init_dkg(participant_index: number, total: number, threshold: number): void;
    is_dkg_complete(): boolean;
    constructor();
    sign(message_hex: string): string;
    signing_commit(): string;
}

export class FrostDkgUnified {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Add a round 1 package from another participant.
     * package_json is the JSON output from another participant's generate_round1().
     */
    add_round1_package(participant_index: number, package_json: string): void;
    /**
     * Add round 2 packages from another participant for both curves.
     */
    add_round2_package(sender_index: number, ed_hex: string, secp_hex: string): void;
    /**
     * Check if DKG can be finalized.
     */
    can_finalize(): boolean;
    /**
     * Check if round 2 can start.
     */
    can_start_round2(): boolean;
    /**
     * Export the ed25519 keystore data (for use with FrostDkgEd25519 signing).
     * Must be called after finalize_dkg().
     */
    export_ed25519_keystore(): string;
    /**
     * Export the secp256k1 keystore data (for use with FrostDkgSecp256k1 signing).
     * Must be called after finalize_dkg().
     */
    export_secp256k1_keystore(): string;
    /**
     * Finalize DKG, producing a multi-curve keystore.
     * Returns JSON with both ed25519 and secp256k1 keystore data.
     */
    finalize_dkg(): string;
    /**
     * Create a unified DKG from an existing root secret (hex-encoded 32 bytes).
     */
    static from_root_secret(root_secret_hex: string): FrostDkgUnified;
    /**
     * Generate round 1 packages for both curves.
     * Returns JSON: `{ "ed25519": "<hex>", "secp256k1": "<hex>" }`
     */
    generate_round1(): string;
    /**
     * Generate round 2 packages for both curves.
     * Returns JSON: `{ "ed25519": { <participant_index>: "<hex>", ... }, "secp256k1": { ... } }`
     */
    generate_round2(): string;
    /**
     * Get ed25519 group public key (hex).
     */
    get_ed25519_public_key(): string;
    /**
     * Get the root secret as hex (for backup/storage).
     */
    get_root_secret_hex(): string;
    /**
     * Get secp256k1 group public key (hex).
     */
    get_secp256k1_public_key(): string;
    /**
     * Get Solana address (ed25519 base58).
     */
    get_solana_address(): string;
    /**
     * Initialize DKG parameters.
     */
    init_dkg(participant_index: number, total: number, threshold: number): void;
    /**
     * Check if DKG is complete for both curves.
     */
    is_dkg_complete(): boolean;
    /**
     * Create a new unified DKG with a fresh root secret.
     */
    constructor();
}

export class FrostReshareEd25519 {
    free(): void;
    [Symbol.dispose](): void;
    add_reshare_round1(from: number, package_hex: string): void;
    add_reshare_round2(from: number, package_hex: string): void;
    can_finalize_reshare(): boolean;
    can_reshare_round2(): boolean;
    /**
     * Finalize and return the NEW keystore JSON (same format as
     * export_keystore — drop-in replacement for the stored share).
     */
    finalize_reshare(): string;
    /**
     * Group public key hex after finalize — callers verify it equals
     * the pre-reshare key (address unchanged).
     */
    get_group_public_key(): string;
    /**
     * Start a reshare from this device's existing keystore JSON (the
     * exact format export_keystore produces). `new_ids` is the
     * comma-separated new participant set (must include this device;
     * every id must already hold a share).
     */
    init_reshare(keystore_json: string, new_ids_csv: string, new_threshold: number): void;
    constructor();
    /**
     * Generate this device's round-1 package (broadcast to all peers).
     */
    reshare_round1(): string;
    /**
     * Generate the per-recipient round-2 packages as a JSON object
     * mapping recipient id → hex package. Send each value ONLY to its
     * recipient.
     */
    reshare_round2(): string;
}

export class FrostReshareSecp256k1 {
    free(): void;
    [Symbol.dispose](): void;
    add_reshare_round1(from: number, package_hex: string): void;
    add_reshare_round2(from: number, package_hex: string): void;
    can_finalize_reshare(): boolean;
    can_reshare_round2(): boolean;
    /**
     * Finalize and return the NEW keystore JSON (same format as
     * export_keystore — drop-in replacement for the stored share).
     */
    finalize_reshare(): string;
    /**
     * Group public key hex after finalize — callers verify it equals
     * the pre-reshare key (address unchanged).
     */
    get_group_public_key(): string;
    /**
     * Start a reshare from this device's existing keystore JSON (the
     * exact format export_keystore produces). `new_ids` is the
     * comma-separated new participant set (must include this device;
     * every id must already hold a share).
     */
    init_reshare(keystore_json: string, new_ids_csv: string, new_threshold: number): void;
    constructor();
    /**
     * Generate this device's round-1 package (broadcast to all peers).
     */
    reshare_round1(): string;
    /**
     * Generate the per-recipient round-2 packages as a JSON object
     * mapping recipient id → hex package. Send each value ONLY to its
     * recipient.
     */
    reshare_round2(): string;
}

export class WasmError {
    free(): void;
    [Symbol.dispose](): void;
    constructor(message: string);
    readonly message: string;
}

/**
 * Account `i`'s addresses for one curve's group key — PUBLIC derivation
 * only (no key share, no password). Returns JSON:
 * `[{"chain":"Ethereum","path":"m/44'/...","address":"0x…"}, …]`.
 */
export function derive_account_addresses(curve: string, group_public_key_hex: string, account: number): string;

/**
 * Derive a child keystore at a BIP-44 path (e.g. "m/44'/60'/0'/0/1").
 * Deterministic across participants (chain code comes from the group
 * key), so every device derives the SAME child account. The output is
 * a full keystore JSON — import it into a FrostDkg instance and sign
 * with the derived account like any other.
 */
export function derive_child_keystore_ed25519(keystore_json: string, path: string): string;

/**
 * Derive a child keystore at a BIP-44 path (e.g. "m/44'/60'/0'/0/1").
 * Deterministic across participants (chain code comes from the group
 * key), so every device derives the SAME child account. The output is
 * a full keystore JSON — import it into a FrostDkg instance and sign
 * with the derived account like any other.
 */
export function derive_child_keystore_secp256k1(keystore_json: string, path: string): string;

/**
 * Curve tag of the ECDSA key (keystore / accounts / signing announce).
 */
export function ecdsa_curve(): string;

/**
 * Ethereum address of `account` for an ECDSA group key (hex SEC1) —
 * public-only, the same as `derive_account_addresses("secp256k1-ecdsa", …)`.
 */
export function ecdsa_ethereum_address(group_public_key_hex: string, account: number): string;

/**
 * Execution id (hex) of a ceremony — `protocol` is "aux-info" | "keygen" |
 * "signing"; `participants` are device ids in any order. Lets a caller
 * route a payload that arrives before its ceremony exists.
 */
export function ecdsa_execution_id(session_id: string, protocol_tag: string, participants: string[]): string;

/**
 * Generate ONE Paillier safe prime (JSON `{"radix":16,"value":…}`). Slow
 * (minutes in wasm): a set needs four — run them in parallel workers and
 * join with [`ecdsa_primes_from_parts`].
 */
export function ecdsa_generate_safe_prime(): string;

/**
 * Join a keygen output and an aux-info output (both from `proceed()`) into
 * the persistable key share JSON (secret: encrypt before storing).
 * `participants` = the sorted device ids the ceremonies ran with.
 */
export function ecdsa_key_share_from_parts(participants: string[], keygen_json: string, aux_info_json: string): string;

/**
 * Execution id (hex) in a driver payload's header, or undefined.
 */
export function ecdsa_payload_execution_id(payload: Uint8Array): string | undefined;

/**
 * Number of safe primes per set (4).
 */
export function ecdsa_prime_count(): number;

/**
 * Join four primes from [`ecdsa_generate_safe_prime`] (JSON array of
 * them) into the primes JSON an aux-info ceremony takes. Secret.
 */
export function ecdsa_primes_from_parts(parts_json: string): string;

/**
 * `ecrecover`: the address a 65-byte `r ‖ s ‖ v` signature (v ∈ {0,1,27,28})
 * over the 32-byte `prehash` recovers to (lowercase 0x hex).
 */
export function ecdsa_recover_ethereum_address(prehash: Uint8Array, signature: Uint8Array): string;

/**
 * Public facts of a key share JSON: `{"participants":[…],"index":i,
 * "threshold":t,"n":n,"group_public_key":"<33-byte SEC1 hex>"}`.
 */
export function ecdsa_share_info(share_json: string): string;

export function main(): void;

/**
 * The pinned standard derivation path for a chain + account index
 * (ETH m/44'/60'/0'/0/i, BTC m/86'/0'/0'/0/i, SOL m/44'/501'/i'/0',
 * Sui m/44'/784'/i'/0'/0'). Returns null for unknown chains.
 */
export function standard_account_path(chain: string, account: number): string | undefined;

export function start(): void;

/**
 * Re-encode a package the engine produced (hex of its JSON — what
 * generate_round1/2, signing_commit and sign return) in FROST's binary
 * `serialize()` form, the CLI/TUI wire encoding (`DKG_ROUND1:`,
 * `DKG_ROUND2:`, `SIGN_COMMIT:`, `SIGN_SHARE:` frames). Returns hex.
 *
 * `curve`: "ed25519" | "secp256k1" (secp256k1 is the BIP-340 / Taproot suite);
 * `kind`: "round1" | "round2" | "commitment" | "share".
 */
export function to_frost_wire(curve: string, kind: string, json_hex: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_ecdsaauxinfo_free: (a: number, b: number) => void;
    readonly __wbg_ecdsakeygen_free: (a: number, b: number) => void;
    readonly __wbg_ecdsasigning_free: (a: number, b: number) => void;
    readonly __wbg_frostdkged25519_free: (a: number, b: number) => void;
    readonly __wbg_frostdkgsecp256k1_free: (a: number, b: number) => void;
    readonly __wbg_frostdkgunified_free: (a: number, b: number) => void;
    readonly __wbg_frostreshareed25519_free: (a: number, b: number) => void;
    readonly __wbg_frostresharesecp256k1_free: (a: number, b: number) => void;
    readonly __wbg_wasmerror_free: (a: number, b: number) => void;
    readonly derive_account_addresses: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly derive_child_keystore_ed25519: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly derive_child_keystore_secp256k1: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly ecdsa_curve: () => [number, number];
    readonly ecdsa_ethereum_address: (a: number, b: number, c: number) => [number, number, number, number];
    readonly ecdsa_execution_id: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly ecdsa_generate_safe_prime: () => [number, number];
    readonly ecdsa_key_share_from_parts: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly ecdsa_payload_execution_id: (a: number, b: number) => [number, number];
    readonly ecdsa_prime_count: () => number;
    readonly ecdsa_primes_from_parts: (a: number, b: number) => [number, number, number, number];
    readonly ecdsa_recover_ethereum_address: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly ecdsa_share_info: (a: number, b: number) => [number, number, number, number];
    readonly ecdsaauxinfo_execution_id: (a: number) => [number, number];
    readonly ecdsaauxinfo_index: (a: number) => number;
    readonly ecdsaauxinfo_is_finished: (a: number) => number;
    readonly ecdsaauxinfo_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly ecdsaauxinfo_parties: (a: number) => [number, number];
    readonly ecdsaauxinfo_proceed: (a: number) => [number, number, number, number];
    readonly ecdsaauxinfo_receive: (a: number, b: number, c: number, d: number) => [number, number];
    readonly ecdsaauxinfo_take_outgoing: (a: number) => any;
    readonly ecdsakeygen_execution_id: (a: number) => [number, number];
    readonly ecdsakeygen_index: (a: number) => number;
    readonly ecdsakeygen_is_finished: (a: number) => number;
    readonly ecdsakeygen_new: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly ecdsakeygen_parties: (a: number) => [number, number];
    readonly ecdsakeygen_proceed: (a: number) => [number, number, number, number];
    readonly ecdsakeygen_receive: (a: number, b: number, c: number, d: number) => [number, number];
    readonly ecdsakeygen_take_outgoing: (a: number) => any;
    readonly ecdsasigning_execution_id: (a: number) => [number, number];
    readonly ecdsasigning_index: (a: number) => number;
    readonly ecdsasigning_is_finished: (a: number) => number;
    readonly ecdsasigning_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number, number];
    readonly ecdsasigning_parties: (a: number) => [number, number];
    readonly ecdsasigning_proceed: (a: number) => [number, number, number, number];
    readonly ecdsasigning_receive: (a: number, b: number, c: number, d: number) => [number, number];
    readonly ecdsasigning_take_outgoing: (a: number) => any;
    readonly frostdkged25519_add_round1_package: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkged25519_add_round2_package: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkged25519_add_signature_share: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkged25519_add_signing_commitment: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkged25519_aggregate_signature: (a: number, b: number, c: number) => [number, number, number, number];
    readonly frostdkged25519_can_finalize: (a: number) => number;
    readonly frostdkged25519_can_start_round2: (a: number) => number;
    readonly frostdkged25519_clear_signing_state: (a: number) => void;
    readonly frostdkged25519_export_keystore: (a: number) => [number, number, number, number];
    readonly frostdkged25519_finalize_dkg: (a: number) => [number, number, number, number];
    readonly frostdkged25519_generate_round1: (a: number) => [number, number, number, number];
    readonly frostdkged25519_generate_round2: (a: number) => [number, number, number, number];
    readonly frostdkged25519_get_address: (a: number) => [number, number, number, number];
    readonly frostdkged25519_get_group_public_key: (a: number) => [number, number, number, number];
    readonly frostdkged25519_has_signing_nonces: (a: number) => number;
    readonly frostdkged25519_import_keystore: (a: number, b: number, c: number) => [number, number];
    readonly frostdkged25519_init_dkg: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkged25519_is_dkg_complete: (a: number) => number;
    readonly frostdkged25519_new: () => number;
    readonly frostdkged25519_sign: (a: number, b: number, c: number) => [number, number, number, number];
    readonly frostdkged25519_signing_commit: (a: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_add_round1_package: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkgsecp256k1_add_round2_package: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkgsecp256k1_add_signature_share: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkgsecp256k1_add_signing_commitment: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkgsecp256k1_aggregate_signature: (a: number, b: number, c: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_can_finalize: (a: number) => number;
    readonly frostdkgsecp256k1_can_start_round2: (a: number) => number;
    readonly frostdkgsecp256k1_clear_signing_state: (a: number) => void;
    readonly frostdkgsecp256k1_export_keystore: (a: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_finalize_dkg: (a: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_generate_round1: (a: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_generate_round2: (a: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_get_address: (a: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_get_group_public_key: (a: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_has_signing_nonces: (a: number) => number;
    readonly frostdkgsecp256k1_import_keystore: (a: number, b: number, c: number) => [number, number];
    readonly frostdkgsecp256k1_init_dkg: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkgsecp256k1_is_dkg_complete: (a: number) => number;
    readonly frostdkgsecp256k1_new: () => number;
    readonly frostdkgsecp256k1_sign: (a: number, b: number, c: number) => [number, number, number, number];
    readonly frostdkgsecp256k1_signing_commit: (a: number) => [number, number, number, number];
    readonly frostdkgunified_add_round1_package: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostdkgunified_add_round2_package: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly frostdkgunified_can_finalize: (a: number) => number;
    readonly frostdkgunified_can_start_round2: (a: number) => number;
    readonly frostdkgunified_export_ed25519_keystore: (a: number) => [number, number, number, number];
    readonly frostdkgunified_export_secp256k1_keystore: (a: number) => [number, number, number, number];
    readonly frostdkgunified_finalize_dkg: (a: number) => [number, number, number, number];
    readonly frostdkgunified_from_root_secret: (a: number, b: number) => [number, number, number];
    readonly frostdkgunified_generate_round1: (a: number) => [number, number, number, number];
    readonly frostdkgunified_generate_round2: (a: number) => [number, number, number, number];
    readonly frostdkgunified_get_ed25519_public_key: (a: number) => [number, number, number, number];
    readonly frostdkgunified_get_root_secret_hex: (a: number) => [number, number];
    readonly frostdkgunified_get_secp256k1_public_key: (a: number) => [number, number, number, number];
    readonly frostdkgunified_get_solana_address: (a: number) => [number, number, number, number];
    readonly frostdkgunified_init_dkg: (a: number, b: number, c: number, d: number) => void;
    readonly frostdkgunified_is_dkg_complete: (a: number) => number;
    readonly frostdkgunified_new: () => number;
    readonly frostreshareed25519_add_reshare_round1: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostreshareed25519_add_reshare_round2: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostreshareed25519_can_finalize_reshare: (a: number) => number;
    readonly frostreshareed25519_can_reshare_round2: (a: number) => number;
    readonly frostreshareed25519_finalize_reshare: (a: number) => [number, number, number, number];
    readonly frostreshareed25519_get_group_public_key: (a: number) => [number, number, number, number];
    readonly frostreshareed25519_init_reshare: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly frostreshareed25519_new: () => number;
    readonly frostreshareed25519_reshare_round1: (a: number) => [number, number, number, number];
    readonly frostreshareed25519_reshare_round2: (a: number) => [number, number, number, number];
    readonly frostresharesecp256k1_add_reshare_round1: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostresharesecp256k1_add_reshare_round2: (a: number, b: number, c: number, d: number) => [number, number];
    readonly frostresharesecp256k1_can_finalize_reshare: (a: number) => number;
    readonly frostresharesecp256k1_can_reshare_round2: (a: number) => number;
    readonly frostresharesecp256k1_finalize_reshare: (a: number) => [number, number, number, number];
    readonly frostresharesecp256k1_get_group_public_key: (a: number) => [number, number, number, number];
    readonly frostresharesecp256k1_init_reshare: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly frostresharesecp256k1_new: () => number;
    readonly frostresharesecp256k1_reshare_round1: (a: number) => [number, number, number, number];
    readonly frostresharesecp256k1_reshare_round2: (a: number) => [number, number, number, number];
    readonly main: () => void;
    readonly standard_account_path: (a: number, b: number, c: number) => [number, number];
    readonly start: () => void;
    readonly to_frost_wire: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly wasmerror_message: (a: number) => [number, number];
    readonly wasmerror_new: (a: number, b: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
