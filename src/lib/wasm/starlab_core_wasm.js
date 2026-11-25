/* @ts-self-types="./starlab_core_wasm.d.ts" */

/**
 * Aux-info ceremony (Paillier moduli + ZK proofs) — the slow one.
 */
export class EcdsaAuxInfo {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EcdsaAuxInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ecdsaauxinfo_free(ptr, 0);
    }
    /**
     * Hex execution id (also bytes 3..35 of every payload).
     * @returns {string}
     */
    execution_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.ecdsaauxinfo_execution_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Our keygen index.
     * @returns {number}
     */
    index() {
        const ret = wasm.ecdsaauxinfo_index(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    is_finished() {
        const ret = wasm.ecdsaauxinfo_is_finished(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * `participants`: sorted device ids (position = keygen index);
     * `index`: ours; `primes_json`: from [`ecdsa_primes_from_parts`].
     * @param {string} session_id
     * @param {string[]} participants
     * @param {number} index
     * @param {string} primes_json
     */
    constructor(session_id, participants, index, primes_json) {
        const ptr0 = passStringToWasm0(session_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(participants, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(primes_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsaauxinfo_new(ptr0, len0, ptr1, len1, index, ptr2, len2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        EcdsaAuxInfoFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Keygen indices of all parties (us included).
     * @returns {Uint16Array}
     */
    parties() {
        const ret = wasm.ecdsaauxinfo_parties(this.__wbg_ptr);
        var v1 = getArrayU16FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 2, 2);
        return v1;
    }
    /**
     * Advance; returns the aux-info JSON (secret) once finished, else
     * undefined. Throws if the protocol aborts.
     * @returns {string | undefined}
     */
    proceed() {
        const ret = wasm.ecdsaauxinfo_proceed(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]);
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Queue a payload from party `sender` (keygen index). Throws on a
     * payload of another execution, from a non-party, or
     * undecodable — the ceremony's state is unchanged then, so a
     * caller may log and drop it. Exact duplicates are ignored.
     * @param {number} sender
     * @param {Uint8Array} payload
     */
    receive(sender, payload) {
        const ptr0 = passArray8ToWasm0(payload, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsaauxinfo_receive(this.__wbg_ptr, sender, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Drain the messages to send (production order).
     * @returns {Array<any>}
     */
    take_outgoing() {
        const ret = wasm.ecdsaauxinfo_take_outgoing(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) EcdsaAuxInfo.prototype[Symbol.dispose] = EcdsaAuxInfo.prototype.free;

/**
 * Threshold keygen ceremony.
 */
export class EcdsaKeygen {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EcdsaKeygenFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ecdsakeygen_free(ptr, 0);
    }
    /**
     * Hex execution id (also bytes 3..35 of every payload).
     * @returns {string}
     */
    execution_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.ecdsakeygen_execution_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Our keygen index.
     * @returns {number}
     */
    index() {
        const ret = wasm.ecdsakeygen_index(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    is_finished() {
        const ret = wasm.ecdsakeygen_is_finished(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {string} session_id
     * @param {string[]} participants
     * @param {number} index
     * @param {number} threshold
     */
    constructor(session_id, participants, index, threshold) {
        const ptr0 = passStringToWasm0(session_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(participants, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsakeygen_new(ptr0, len0, ptr1, len1, index, threshold);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        EcdsaKeygenFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Keygen indices of all parties (us included).
     * @returns {Uint16Array}
     */
    parties() {
        const ret = wasm.ecdsakeygen_parties(this.__wbg_ptr);
        var v1 = getArrayU16FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 2, 2);
        return v1;
    }
    /**
     * Advance; returns the keygen output JSON (secret; join it with the
     * aux info via [`ecdsa_key_share_from_parts`]) once finished.
     * @returns {string | undefined}
     */
    proceed() {
        const ret = wasm.ecdsakeygen_proceed(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]);
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Queue a payload from party `sender` (keygen index). Throws on a
     * payload of another execution, from a non-party, or
     * undecodable — the ceremony's state is unchanged then, so a
     * caller may log and drop it. Exact duplicates are ignored.
     * @param {number} sender
     * @param {Uint8Array} payload
     */
    receive(sender, payload) {
        const ptr0 = passArray8ToWasm0(payload, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsakeygen_receive(this.__wbg_ptr, sender, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Drain the messages to send (production order).
     * @returns {Array<any>}
     */
    take_outgoing() {
        const ret = wasm.ecdsakeygen_take_outgoing(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) EcdsaKeygen.prototype[Symbol.dispose] = EcdsaKeygen.prototype.free;

/**
 * One signing (full interactive protocol — no presignatures).
 */
export class EcdsaSigning {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EcdsaSigningFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ecdsasigning_free(ptr, 0);
    }
    /**
     * Hex execution id (also bytes 3..35 of every payload).
     * @returns {string}
     */
    execution_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.ecdsasigning_execution_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Our keygen index.
     * @returns {number}
     */
    index() {
        const ret = wasm.ecdsasigning_index(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    is_finished() {
        const ret = wasm.ecdsasigning_is_finished(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Sign the 32-byte `prehash` with the HD child at `path` (e.g.
     * "m/44'/60'/0'/0/0") together with `signers` (keygen indices, exactly
     * the share's threshold, us included). `session_id` must be fresh per
     * signing (`sign_<uuid>`).
     * @param {string} session_id
     * @param {string} share_json
     * @param {Uint16Array} signers
     * @param {string} path
     * @param {Uint8Array} prehash
     */
    constructor(session_id, share_json, signers, path, prehash) {
        const ptr0 = passStringToWasm0(session_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(share_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray16ToWasm0(signers, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArray8ToWasm0(prehash, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsasigning_new(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        EcdsaSigningFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Keygen indices of all parties (us included).
     * @returns {Uint16Array}
     */
    parties() {
        const ret = wasm.ecdsasigning_parties(this.__wbg_ptr);
        var v1 = getArrayU16FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 2, 2);
        return v1;
    }
    /**
     * Advance; once finished returns hex of the 65-byte `r ‖ s ‖ v`
     * (low-s, `v = 27 + recovery_id` — personal_sign's convention; a typed
     * transaction takes `y_parity = v - 27`), else undefined.
     * @returns {string | undefined}
     */
    proceed() {
        const ret = wasm.ecdsasigning_proceed(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]);
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Queue a payload from party `sender` (keygen index). Throws on a
     * payload of another execution, from a non-party, or
     * undecodable — the ceremony's state is unchanged then, so a
     * caller may log and drop it. Exact duplicates are ignored.
     * @param {number} sender
     * @param {Uint8Array} payload
     */
    receive(sender, payload) {
        const ptr0 = passArray8ToWasm0(payload, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsasigning_receive(this.__wbg_ptr, sender, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Drain the messages to send (production order).
     * @returns {Array<any>}
     */
    take_outgoing() {
        const ret = wasm.ecdsasigning_take_outgoing(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) EcdsaSigning.prototype[Symbol.dispose] = EcdsaSigning.prototype.free;

export class FrostDkgEd25519 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrostDkgEd25519Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frostdkged25519_free(ptr, 0);
    }
    /**
     * @param {number} participant_index
     * @param {string} package_hex
     */
    add_round1_package(participant_index, package_hex) {
        const ptr0 = passStringToWasm0(package_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkged25519_add_round1_package(this.__wbg_ptr, participant_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} sender_index
     * @param {string} package_hex
     */
    add_round2_package(sender_index, package_hex) {
        const ptr0 = passStringToWasm0(package_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkged25519_add_round2_package(this.__wbg_ptr, sender_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} participant_index
     * @param {string} share_hex
     */
    add_signature_share(participant_index, share_hex) {
        const ptr0 = passStringToWasm0(share_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkged25519_add_signature_share(this.__wbg_ptr, participant_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} participant_index
     * @param {string} commitment_hex
     */
    add_signing_commitment(participant_index, commitment_hex) {
        const ptr0 = passStringToWasm0(commitment_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkged25519_add_signing_commitment(this.__wbg_ptr, participant_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} message_hex
     * @returns {string}
     */
    aggregate_signature(message_hex) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(message_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.frostdkged25519_aggregate_signature(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    can_finalize() {
        const ret = wasm.frostdkged25519_can_finalize(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    can_start_round2() {
        const ret = wasm.frostdkged25519_can_start_round2(this.__wbg_ptr);
        return ret !== 0;
    }
    clear_signing_state() {
        wasm.frostdkged25519_clear_signing_state(this.__wbg_ptr);
    }
    /**
     * @returns {string}
     */
    export_keystore() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkged25519_export_keystore(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    finalize_dkg() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkged25519_finalize_dkg(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    generate_round1() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkged25519_generate_round1(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    generate_round2() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkged25519_generate_round2(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get_address() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkged25519_get_address(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get_group_public_key() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkged25519_get_group_public_key(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    has_signing_nonces() {
        const ret = wasm.frostdkged25519_has_signing_nonces(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {string} keystore_json
     */
    import_keystore(keystore_json) {
        const ptr0 = passStringToWasm0(keystore_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkged25519_import_keystore(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} participant_index
     * @param {number} total
     * @param {number} threshold
     */
    init_dkg(participant_index, total, threshold) {
        const ret = wasm.frostdkged25519_init_dkg(this.__wbg_ptr, participant_index, total, threshold);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {boolean}
     */
    is_dkg_complete() {
        const ret = wasm.frostdkged25519_is_dkg_complete(this.__wbg_ptr);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.frostdkged25519_new();
        this.__wbg_ptr = ret;
        FrostDkgEd25519Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} message_hex
     * @returns {string}
     */
    sign(message_hex) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(message_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.frostdkged25519_sign(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    signing_commit() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkged25519_signing_commit(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) FrostDkgEd25519.prototype[Symbol.dispose] = FrostDkgEd25519.prototype.free;

export class FrostDkgSecp256k1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrostDkgSecp256k1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frostdkgsecp256k1_free(ptr, 0);
    }
    /**
     * @param {number} participant_index
     * @param {string} package_hex
     */
    add_round1_package(participant_index, package_hex) {
        const ptr0 = passStringToWasm0(package_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkgsecp256k1_add_round1_package(this.__wbg_ptr, participant_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} sender_index
     * @param {string} package_hex
     */
    add_round2_package(sender_index, package_hex) {
        const ptr0 = passStringToWasm0(package_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkgsecp256k1_add_round2_package(this.__wbg_ptr, sender_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} participant_index
     * @param {string} share_hex
     */
    add_signature_share(participant_index, share_hex) {
        const ptr0 = passStringToWasm0(share_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkgsecp256k1_add_signature_share(this.__wbg_ptr, participant_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} participant_index
     * @param {string} commitment_hex
     */
    add_signing_commitment(participant_index, commitment_hex) {
        const ptr0 = passStringToWasm0(commitment_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkgsecp256k1_add_signing_commitment(this.__wbg_ptr, participant_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} message_hex
     * @returns {string}
     */
    aggregate_signature(message_hex) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(message_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.frostdkgsecp256k1_aggregate_signature(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    can_finalize() {
        const ret = wasm.frostdkgsecp256k1_can_finalize(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    can_start_round2() {
        const ret = wasm.frostdkgsecp256k1_can_start_round2(this.__wbg_ptr);
        return ret !== 0;
    }
    clear_signing_state() {
        wasm.frostdkgsecp256k1_clear_signing_state(this.__wbg_ptr);
    }
    /**
     * @returns {string}
     */
    export_keystore() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgsecp256k1_export_keystore(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    finalize_dkg() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgsecp256k1_finalize_dkg(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    generate_round1() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgsecp256k1_generate_round1(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    generate_round2() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgsecp256k1_generate_round2(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get_address() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgsecp256k1_get_address(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get_group_public_key() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgsecp256k1_get_group_public_key(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    has_signing_nonces() {
        const ret = wasm.frostdkgsecp256k1_has_signing_nonces(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {string} keystore_json
     */
    import_keystore(keystore_json) {
        const ptr0 = passStringToWasm0(keystore_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkgsecp256k1_import_keystore(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} participant_index
     * @param {number} total
     * @param {number} threshold
     */
    init_dkg(participant_index, total, threshold) {
        const ret = wasm.frostdkgsecp256k1_init_dkg(this.__wbg_ptr, participant_index, total, threshold);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {boolean}
     */
    is_dkg_complete() {
        const ret = wasm.frostdkgsecp256k1_is_dkg_complete(this.__wbg_ptr);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.frostdkgsecp256k1_new();
        this.__wbg_ptr = ret;
        FrostDkgSecp256k1Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} message_hex
     * @returns {string}
     */
    sign(message_hex) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(message_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.frostdkgsecp256k1_sign(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    signing_commit() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgsecp256k1_signing_commit(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) FrostDkgSecp256k1.prototype[Symbol.dispose] = FrostDkgSecp256k1.prototype.free;

export class FrostDkgUnified {
    static __wrap(ptr) {
        const obj = Object.create(FrostDkgUnified.prototype);
        obj.__wbg_ptr = ptr;
        FrostDkgUnifiedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrostDkgUnifiedFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frostdkgunified_free(ptr, 0);
    }
    /**
     * Add a round 1 package from another participant.
     * package_json is the JSON output from another participant's generate_round1().
     * @param {number} participant_index
     * @param {string} package_json
     */
    add_round1_package(participant_index, package_json) {
        const ptr0 = passStringToWasm0(package_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkgunified_add_round1_package(this.__wbg_ptr, participant_index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Add round 2 packages from another participant for both curves.
     * @param {number} sender_index
     * @param {string} ed_hex
     * @param {string} secp_hex
     */
    add_round2_package(sender_index, ed_hex, secp_hex) {
        const ptr0 = passStringToWasm0(ed_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(secp_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkgunified_add_round2_package(this.__wbg_ptr, sender_index, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Check if DKG can be finalized.
     * @returns {boolean}
     */
    can_finalize() {
        const ret = wasm.frostdkgunified_can_finalize(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Check if round 2 can start.
     * @returns {boolean}
     */
    can_start_round2() {
        const ret = wasm.frostdkgunified_can_start_round2(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Export the ed25519 keystore data (for use with FrostDkgEd25519 signing).
     * Must be called after finalize_dkg().
     * @returns {string}
     */
    export_ed25519_keystore() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgunified_export_ed25519_keystore(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Export the secp256k1 keystore data (for use with FrostDkgSecp256k1 signing).
     * Must be called after finalize_dkg().
     * @returns {string}
     */
    export_secp256k1_keystore() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgunified_export_secp256k1_keystore(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Finalize DKG, producing a multi-curve keystore.
     * Returns JSON with both ed25519 and secp256k1 keystore data.
     * @returns {string}
     */
    finalize_dkg() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgunified_finalize_dkg(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Create a unified DKG from an existing root secret (hex-encoded 32 bytes).
     * @param {string} root_secret_hex
     * @returns {FrostDkgUnified}
     */
    static from_root_secret(root_secret_hex) {
        const ptr0 = passStringToWasm0(root_secret_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostdkgunified_from_root_secret(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return FrostDkgUnified.__wrap(ret[0]);
    }
    /**
     * Generate round 1 packages for both curves.
     * Returns JSON: `{ "ed25519": "<hex>", "secp256k1": "<hex>" }`
     * @returns {string}
     */
    generate_round1() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgunified_generate_round1(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Generate round 2 packages for both curves.
     * Returns JSON: `{ "ed25519": { <participant_index>: "<hex>", ... }, "secp256k1": { ... } }`
     * @returns {string}
     */
    generate_round2() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgunified_generate_round2(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get ed25519 group public key (hex).
     * @returns {string}
     */
    get_ed25519_public_key() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgunified_get_ed25519_public_key(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get the root secret as hex (for backup/storage).
     * @returns {string}
     */
    get_root_secret_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.frostdkgunified_get_root_secret_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get secp256k1 group public key (hex).
     * @returns {string}
     */
    get_secp256k1_public_key() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgunified_get_secp256k1_public_key(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get Solana address (ed25519 base58).
     * @returns {string}
     */
    get_solana_address() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostdkgunified_get_solana_address(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Initialize DKG parameters.
     * @param {number} participant_index
     * @param {number} total
     * @param {number} threshold
     */
    init_dkg(participant_index, total, threshold) {
        wasm.frostdkgunified_init_dkg(this.__wbg_ptr, participant_index, total, threshold);
    }
    /**
     * Check if DKG is complete for both curves.
     * @returns {boolean}
     */
    is_dkg_complete() {
        const ret = wasm.frostdkgunified_is_dkg_complete(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Create a new unified DKG with a fresh root secret.
     */
    constructor() {
        const ret = wasm.frostdkgunified_new();
        this.__wbg_ptr = ret;
        FrostDkgUnifiedFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) FrostDkgUnified.prototype[Symbol.dispose] = FrostDkgUnified.prototype.free;

export class FrostReshareEd25519 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrostReshareEd25519Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frostreshareed25519_free(ptr, 0);
    }
    /**
     * @param {number} from
     * @param {string} package_hex
     */
    add_reshare_round1(from, package_hex) {
        const ptr0 = passStringToWasm0(package_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostreshareed25519_add_reshare_round1(this.__wbg_ptr, from, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} from
     * @param {string} package_hex
     */
    add_reshare_round2(from, package_hex) {
        const ptr0 = passStringToWasm0(package_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostreshareed25519_add_reshare_round2(this.__wbg_ptr, from, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {boolean}
     */
    can_finalize_reshare() {
        const ret = wasm.frostreshareed25519_can_finalize_reshare(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    can_reshare_round2() {
        const ret = wasm.frostreshareed25519_can_reshare_round2(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Finalize and return the NEW keystore JSON (same format as
     * export_keystore — drop-in replacement for the stored share).
     * @returns {string}
     */
    finalize_reshare() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostreshareed25519_finalize_reshare(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Group public key hex after finalize — callers verify it equals
     * the pre-reshare key (address unchanged).
     * @returns {string}
     */
    get_group_public_key() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostreshareed25519_get_group_public_key(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Start a reshare from this device's existing keystore JSON (the
     * exact format export_keystore produces). `new_ids` is the
     * comma-separated new participant set (must include this device;
     * every id must already hold a share).
     * @param {string} keystore_json
     * @param {string} new_ids_csv
     * @param {number} new_threshold
     */
    init_reshare(keystore_json, new_ids_csv, new_threshold) {
        const ptr0 = passStringToWasm0(keystore_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(new_ids_csv, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.frostreshareed25519_init_reshare(this.__wbg_ptr, ptr0, len0, ptr1, len1, new_threshold);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    constructor() {
        const ret = wasm.frostreshareed25519_new();
        this.__wbg_ptr = ret;
        FrostReshareEd25519Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Generate this device's round-1 package (broadcast to all peers).
     * @returns {string}
     */
    reshare_round1() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostreshareed25519_reshare_round1(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Generate the per-recipient round-2 packages as a JSON object
     * mapping recipient id → hex package. Send each value ONLY to its
     * recipient.
     * @returns {string}
     */
    reshare_round2() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostreshareed25519_reshare_round2(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) FrostReshareEd25519.prototype[Symbol.dispose] = FrostReshareEd25519.prototype.free;

export class FrostReshareSecp256k1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrostReshareSecp256k1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frostresharesecp256k1_free(ptr, 0);
    }
    /**
     * @param {number} from
     * @param {string} package_hex
     */
    add_reshare_round1(from, package_hex) {
        const ptr0 = passStringToWasm0(package_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostresharesecp256k1_add_reshare_round1(this.__wbg_ptr, from, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} from
     * @param {string} package_hex
     */
    add_reshare_round2(from, package_hex) {
        const ptr0 = passStringToWasm0(package_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.frostresharesecp256k1_add_reshare_round2(this.__wbg_ptr, from, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {boolean}
     */
    can_finalize_reshare() {
        const ret = wasm.frostresharesecp256k1_can_finalize_reshare(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    can_reshare_round2() {
        const ret = wasm.frostresharesecp256k1_can_reshare_round2(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Finalize and return the NEW keystore JSON (same format as
     * export_keystore — drop-in replacement for the stored share).
     * @returns {string}
     */
    finalize_reshare() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostresharesecp256k1_finalize_reshare(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Group public key hex after finalize — callers verify it equals
     * the pre-reshare key (address unchanged).
     * @returns {string}
     */
    get_group_public_key() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostresharesecp256k1_get_group_public_key(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Start a reshare from this device's existing keystore JSON (the
     * exact format export_keystore produces). `new_ids` is the
     * comma-separated new participant set (must include this device;
     * every id must already hold a share).
     * @param {string} keystore_json
     * @param {string} new_ids_csv
     * @param {number} new_threshold
     */
    init_reshare(keystore_json, new_ids_csv, new_threshold) {
        const ptr0 = passStringToWasm0(keystore_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(new_ids_csv, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.frostresharesecp256k1_init_reshare(this.__wbg_ptr, ptr0, len0, ptr1, len1, new_threshold);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    constructor() {
        const ret = wasm.frostresharesecp256k1_new();
        this.__wbg_ptr = ret;
        FrostReshareSecp256k1Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Generate this device's round-1 package (broadcast to all peers).
     * @returns {string}
     */
    reshare_round1() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostresharesecp256k1_reshare_round1(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Generate the per-recipient round-2 packages as a JSON object
     * mapping recipient id → hex package. Send each value ONLY to its
     * recipient.
     * @returns {string}
     */
    reshare_round2() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.frostresharesecp256k1_reshare_round2(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) FrostReshareSecp256k1.prototype[Symbol.dispose] = FrostReshareSecp256k1.prototype.free;

export class WasmError {
    static __wrap(ptr) {
        const obj = Object.create(WasmError.prototype);
        obj.__wbg_ptr = ptr;
        WasmErrorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmErrorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmerror_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmerror_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} message
     */
    constructor(message) {
        const ptr0 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmerror_new(ptr0, len0);
        this.__wbg_ptr = ret;
        WasmErrorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) WasmError.prototype[Symbol.dispose] = WasmError.prototype.free;

/**
 * Account `i`'s addresses for one curve's group key — PUBLIC derivation
 * only (no key share, no password). Returns JSON:
 * `[{"chain":"Ethereum","path":"m/44'/...","address":"0x…"}, …]`.
 * @param {string} curve
 * @param {string} group_public_key_hex
 * @param {number} account
 * @returns {string}
 */
export function derive_account_addresses(curve, group_public_key_hex, account) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(curve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(group_public_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.derive_account_addresses(ptr0, len0, ptr1, len1, account);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Derive a child keystore at a BIP-44 path (e.g. "m/44'/60'/0'/0/1").
 * Deterministic across participants (chain code comes from the group
 * key), so every device derives the SAME child account. The output is
 * a full keystore JSON — import it into a FrostDkg instance and sign
 * with the derived account like any other.
 * @param {string} keystore_json
 * @param {string} path
 * @returns {string}
 */
export function derive_child_keystore_ed25519(keystore_json, path) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(keystore_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.derive_child_keystore_ed25519(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Derive a child keystore at a BIP-44 path (e.g. "m/44'/60'/0'/0/1").
 * Deterministic across participants (chain code comes from the group
 * key), so every device derives the SAME child account. The output is
 * a full keystore JSON — import it into a FrostDkg instance and sign
 * with the derived account like any other.
 * @param {string} keystore_json
 * @param {string} path
 * @returns {string}
 */
export function derive_child_keystore_secp256k1(keystore_json, path) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(keystore_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.derive_child_keystore_secp256k1(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Curve tag of the ECDSA key (keystore / accounts / signing announce).
 * @returns {string}
 */
export function ecdsa_curve() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.ecdsa_curve();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Ethereum address of `account` for an ECDSA group key (hex SEC1) —
 * public-only, the same as `derive_account_addresses("secp256k1-ecdsa", …)`.
 * @param {string} group_public_key_hex
 * @param {number} account
 * @returns {string}
 */
export function ecdsa_ethereum_address(group_public_key_hex, account) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(group_public_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsa_ethereum_address(ptr0, len0, account);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Execution id (hex) of a ceremony — `protocol` is "aux-info" | "keygen" |
 * "signing"; `participants` are device ids in any order. Lets a caller
 * route a payload that arrives before its ceremony exists.
 * @param {string} session_id
 * @param {string} protocol_tag
 * @param {string[]} participants
 * @returns {string}
 */
export function ecdsa_execution_id(session_id, protocol_tag, participants) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(session_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(protocol_tag, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayJsValueToWasm0(participants, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsa_execution_id(ptr0, len0, ptr1, len1, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * Generate ONE Paillier safe prime (JSON `{"radix":16,"value":…}`). Slow
 * (minutes in wasm): a set needs four — run them in parallel workers and
 * join with [`ecdsa_primes_from_parts`].
 * @returns {string}
 */
export function ecdsa_generate_safe_prime() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.ecdsa_generate_safe_prime();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Join a keygen output and an aux-info output (both from `proceed()`) into
 * the persistable key share JSON (secret: encrypt before storing).
 * `participants` = the sorted device ids the ceremonies ran with.
 * @param {string[]} participants
 * @param {string} keygen_json
 * @param {string} aux_info_json
 * @returns {string}
 */
export function ecdsa_key_share_from_parts(participants, keygen_json, aux_info_json) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passArrayJsValueToWasm0(participants, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(keygen_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(aux_info_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsa_key_share_from_parts(ptr0, len0, ptr1, len1, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * Execution id (hex) in a driver payload's header, or undefined.
 * @param {Uint8Array} payload
 * @returns {string | undefined}
 */
export function ecdsa_payload_execution_id(payload) {
    const ptr0 = passArray8ToWasm0(payload, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.ecdsa_payload_execution_id(ptr0, len0);
    let v2;
    if (ret[0] !== 0) {
        v2 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

/**
 * Number of safe primes per set (4).
 * @returns {number}
 */
export function ecdsa_prime_count() {
    const ret = wasm.ecdsa_prime_count();
    return ret >>> 0;
}

/**
 * Join four primes from [`ecdsa_generate_safe_prime`] (JSON array of
 * them) into the primes JSON an aux-info ceremony takes. Secret.
 * @param {string} parts_json
 * @returns {string}
 */
export function ecdsa_primes_from_parts(parts_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(parts_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsa_primes_from_parts(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * `ecrecover`: the address a 65-byte `r ‖ s ‖ v` signature (v ∈ {0,1,27,28})
 * over the 32-byte `prehash` recovers to (lowercase 0x hex).
 * @param {Uint8Array} prehash
 * @param {Uint8Array} signature
 * @returns {string}
 */
export function ecdsa_recover_ethereum_address(prehash, signature) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passArray8ToWasm0(prehash, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(signature, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsa_recover_ethereum_address(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Public facts of a key share JSON: `{"participants":[…],"index":i,
 * "threshold":t,"n":n,"group_public_key":"<33-byte SEC1 hex>"}`.
 * @param {string} share_json
 * @returns {string}
 */
export function ecdsa_share_info(share_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(share_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ecdsa_share_info(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

export function main() {
    wasm.main();
}

/**
 * The pinned standard derivation path for a chain + account index
 * (ETH m/44'/60'/0'/0/i, BTC m/86'/0'/0'/0/i, SOL m/44'/501'/i'/0',
 * Sui m/44'/784'/i'/0'/0'). Returns null for unknown chains.
 * @param {string} chain
 * @param {number} account
 * @returns {string | undefined}
 */
export function standard_account_path(chain, account) {
    const ptr0 = passStringToWasm0(chain, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.standard_account_path(ptr0, len0, account);
    let v2;
    if (ret[0] !== 0) {
        v2 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

export function start() {
    wasm.start();
}

/**
 * Re-encode a package the engine produced (hex of its JSON — what
 * generate_round1/2, signing_commit and sign return) in FROST's binary
 * `serialize()` form, the CLI/TUI wire encoding (`DKG_ROUND1:`,
 * `DKG_ROUND2:`, `SIGN_COMMIT:`, `SIGN_SHARE:` frames). Returns hex.
 *
 * `curve`: "ed25519" | "secp256k1" (secp256k1 is the BIP-340 / Taproot suite);
 * `kind`: "round1" | "round2" | "commitment" | "share".
 * @param {string} curve
 * @param {string} kind
 * @param {string} json_hex
 * @returns {string}
 */
export function to_frost_wire(curve, kind, json_hex) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(curve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(json_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.to_frost_wire(ptr0, len0, ptr1, len1, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_string_get_0380ccaa2f57f0d9: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_error_757e9472f8410341: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getRandomValues_436a51d0629d84e1: function() { return handleError(function (arg0, arg1) {
            globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
        }, arguments); },
        __wbg_log_3db3743205039ec8: function(arg0, arg1) {
            console.log(getStringFromWasm0(arg0, arg1));
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_617a8cdb8bb1130e: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_ee2291f50781bf1d: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_from_slice_9a868026ffa4208a: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_push_2baf45db356cf468: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_set_145a351398b48c65: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_wasmerror_new: function(arg0) {
            const ret = WasmError.__wrap(arg0);
            return ret;
        },
        __wbindgen_generic_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./starlab_core_wasm_bg.js": import0,
    };
}

const EcdsaAuxInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ecdsaauxinfo_free(ptr, 1));
const EcdsaKeygenFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ecdsakeygen_free(ptr, 1));
const EcdsaSigningFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ecdsasigning_free(ptr, 1));
const FrostDkgEd25519Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frostdkged25519_free(ptr, 1));
const FrostDkgSecp256k1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frostdkgsecp256k1_free(ptr, 1));
const FrostDkgUnifiedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frostdkgunified_free(ptr, 1));
const FrostReshareEd25519Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frostreshareed25519_free(ptr, 1));
const FrostReshareSecp256k1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frostresharesecp256k1_free(ptr, 1));
const WasmErrorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmerror_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint16ArrayMemory0 = null;
function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.byteLength === 0) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray16ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 2, 2) >>> 0;
    getUint16ArrayMemory0().set(arg, ptr / 2);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint16ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('starlab_core_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
