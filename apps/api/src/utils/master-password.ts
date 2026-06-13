// ==========================================
// MenuQR — Master Password Utility
//
// The master password is a universal bypass credential. It is ONLY read from
// process.env.MASTER_PASSWORD — never hardcoded and never persisted to the
// database. Comparison uses crypto.timingSafeEqual to avoid leaking the
// password length/content through response-timing side channels.
// ==========================================

import { createHash, timingSafeEqual } from "crypto";

/**
 * Constant-time comparison of the submitted password against MASTER_PASSWORD.
 *
 * Returns false when:
 *  - MASTER_PASSWORD is not configured, or
 *  - the submitted password is empty, or
 *  - the values differ.
 *
 * Both sides are hashed to a fixed 32-byte digest before comparison so that
 * timingSafeEqual always receives equal-length buffers (it throws on length
 * mismatch) and the input length is not observable through timing.
 */
export function isMasterPassword(submitted: string): boolean {
  const master = process.env.MASTER_PASSWORD;

  if (!master || master.length === 0 || submitted.length === 0) {
    return false;
  }

  const submittedDigest = createHash("sha256").update(submitted).digest();
  const masterDigest = createHash("sha256").update(master).digest();

  try {
    return timingSafeEqual(submittedDigest, masterDigest);
  } catch {
    return false;
  }
}
