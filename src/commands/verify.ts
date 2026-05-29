import { randomHex, hmacVerify } from '../utils/crypto';
import { getSigningKey, loadPassport, isRevoked } from '../utils/storage';
import { success, failure, warn, info, bold } from '../utils/colors';
import type { VerificationResult, Passport } from '../types';

interface VerifyOptions {
  json?: boolean;
  scope?: string;
}

function checkActiveHours(activeHoursUtc: string): boolean {
  const match = activeHoursUtc.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) return true; // Can't parse, allow
  const now = new Date();
  const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const startMins = parseInt(match[1]) * 60 + parseInt(match[2]);
  const endMins = parseInt(match[3]) * 60 + parseInt(match[4]);
  if (startMins > endMins) {
    // Overnight window (e.g. 22:00-06:00)
    return nowMins >= startMins || nowMins <= endMins;
  }
  return nowMins >= startMins && nowMins <= endMins;
}

export function buildVerificationPayload(passport: Passport, requestedScope?: string): VerificationResult {
  const nonce = randomHex(16);
  const signingKey = getSigningKey();

  // Check revocation first
  if (isRevoked(passport.passport_id)) {
    return {
      valid: false,
      passport_id: passport.passport_id,
      principal_name: passport.principal.name,
      authorized_scopes: [],
      verification_timestamp: new Date().toISOString(),
      verifier_nonce: nonce,
      error: 'REVOKED',
    };
  }

  // Verify signature — sign everything except the signature field itself
  const { signature, ...passportBody } = passport;
  const sigValid = hmacVerify(signingKey, passportBody, signature);
  if (!sigValid) {
    return {
      valid: false,
      passport_id: passport.passport_id,
      principal_name: passport.principal.name,
      authorized_scopes: [],
      verification_timestamp: new Date().toISOString(),
      verifier_nonce: nonce,
      error: 'INVALID_SIGNATURE',
    };
  }

  // Check expiry
  if (new Date() > new Date(passport.expires_at)) {
    return {
      valid: false,
      passport_id: passport.passport_id,
      principal_name: passport.principal.name,
      authorized_scopes: passport.scopes,
      verification_timestamp: new Date().toISOString(),
      verifier_nonce: nonce,
      error: 'EXPIRED',
    };
  }

  // Check requested scope
  if (requestedScope && !passport.scopes.includes(requestedScope)) {
    return {
      valid: false,
      passport_id: passport.passport_id,
      principal_name: passport.principal.name,
      authorized_scopes: passport.scopes,
      verification_timestamp: new Date().toISOString(),
      verifier_nonce: nonce,
      error: `SCOPE_NOT_AUTHORIZED: ${requestedScope}`,
    };
  }

  // Check active hours constraint
  if (passport.constraints?.active_hours_utc) {
    if (!checkActiveHours(passport.constraints.active_hours_utc as string)) {
      return {
        valid: false,
        passport_id: passport.passport_id,
        principal_name: passport.principal.name,
        authorized_scopes: passport.scopes,
        verification_timestamp: new Date().toISOString(),
        verifier_nonce: nonce,
        error: 'OUTSIDE_ACTIVE_HOURS',
      };
    }
  }

  return {
    valid: true,
    passport_id: passport.passport_id,
    principal_name: passport.principal.name,
    authorized_scopes: passport.scopes,
    verification_timestamp: new Date().toISOString(),
    verifier_nonce: nonce,
  };
}

export async function verifyCommand(passportIdOrPath: string, opts: VerifyOptions): Promise<void> {
  let passport: Passport;
  try {
    passport = loadPassport(passportIdOrPath);
  } catch (err) {
    if (opts.json) {
      console.log(JSON.stringify({ valid: false, error: String(err) }));
    } else {
      failure(String(err));
    }
    process.exit(1);
  }

  const result = buildVerificationPayload(passport, opts.scope);

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(bold('\n🔍  AI Passport — Verification Result\n'));
    if (result.valid) {
      success(`VALID passport`);
    } else {
      failure(`INVALID passport — ${result.error}`);
    }
    info(`Passport ID        : ${result.passport_id}`);
    info(`Principal          : ${result.principal_name}`);
    info(`Authorized scopes  : ${result.authorized_scopes.join(', ')}`);
    info(`Verified at        : ${result.verification_timestamp}`);
    info(`Nonce              : ${result.verifier_nonce}`);
    if (passport.constraints) {
      const c = passport.constraints;
      if (c.max_transaction_usd !== undefined) warn(`Max transaction    : $${c.max_transaction_usd}`);
      if (c.allowed_domains) warn(`Allowed domains    : ${(c.allowed_domains as string[]).join(', ')}`);
      if (c.active_hours_utc) warn(`Active hours (UTC) : ${c.active_hours_utc}`);
    }
    console.log();
  }

  if (!result.valid) process.exit(1);
}
