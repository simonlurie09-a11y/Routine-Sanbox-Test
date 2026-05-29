import * as crypto from 'crypto';

/** Sort object keys recursively and return canonical JSON string. */
export function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const sorted = Object.keys(obj as Record<string, unknown>)
    .sort()
    .map((k) => JSON.stringify(k) + ':' + canonicalJson((obj as Record<string, unknown>)[k]));
  return '{' + sorted.join(',') + '}';
}

/** Generate a cryptographically random hex string of `bytes` bytes. */
export function randomHex(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** HMAC-SHA256 over canonical JSON of payload. Returns hex digest. */
export function hmacSign(key: Buffer, payload: unknown): string {
  return crypto.createHmac('sha256', key).update(canonicalJson(payload)).digest('hex');
}

/** Verify an HMAC-SHA256 signature using timing-safe comparison. */
export function hmacVerify(key: Buffer, payload: unknown, sig: string): boolean {
  const expected = hmacSign(key, payload);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

/** SHA-256 hash of a string. Returns hex. */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/** Derive identity hash: SHA-256(email + ':' + salt). */
export function identityHash(email: string, salt: string): string {
  return sha256(email + ':' + salt);
}

/** Generate a new 32-byte HMAC signing key. */
export function generateSigningKey(): Buffer {
  return crypto.randomBytes(32);
}
