import { v4 as uuidv4 } from 'uuid';
import { sha256, hmacSign, hmacVerify, canonicalJson } from '../utils/crypto';
import { getSigningKey, appendAuditEntry, readAuditLog, loadPassport } from '../utils/storage';
import { success, failure, warn, info, bold, gray } from '../utils/colors';
import type { AuditEntry } from '../types';

interface LogOptions {
  json?: boolean;
}

interface AuditVerifyOptions {
  json?: boolean;
}

interface ShowOptions {
  json?: boolean;
  passportId?: string;
}

function getLastEntryHash(): string {
  const entries = readAuditLog();
  if (entries.length === 0) return '0000000000000000000000000000000000000000000000000000000000000000';
  return entries[entries.length - 1].entry_hash;
}

function buildEntryHash(entry: Omit<AuditEntry, 'entry_hash' | 'signature'>): string {
  return sha256(canonicalJson(entry));
}

export async function auditLogCommand(
  passportIdOrPath: string,
  action: string,
  scopeUsed: string,
  result: string,
  opts: LogOptions
): Promise<void> {
  const passport = loadPassport(passportIdOrPath);
  const signingKey = getSigningKey();
  const prevHash = getLastEntryHash();
  const resultHash = sha256(result);

  const baseEntry = {
    entry_id: uuidv4(),
    timestamp: new Date().toISOString(),
    passport_id: passport.passport_id,
    action,
    scope_used: scopeUsed,
    result,
    result_hash: resultHash,
    prev_hash: prevHash,
  };

  const entryHash = buildEntryHash(baseEntry);
  const signature = hmacSign(signingKey, { ...baseEntry, entry_hash: entryHash });

  const entry: AuditEntry = { ...baseEntry, entry_hash: entryHash, signature };
  appendAuditEntry(entry);

  if (opts.json) {
    console.log(JSON.stringify(entry, null, 2));
  } else {
    success(`Audit entry logged`);
    info(`Entry ID   : ${entry.entry_id}`);
    info(`Passport   : ${entry.passport_id}`);
    info(`Action     : ${entry.action}`);
    info(`Scope      : ${entry.scope_used}`);
    info(`Entry hash : ${entry.entry_hash}`);
  }
}

export async function auditVerifyCommand(opts: AuditVerifyOptions): Promise<void> {
  const entries = readAuditLog();
  const signingKey = getSigningKey();
  let valid = true;
  const errors: string[] = [];

  let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check chain link
    if (entry.prev_hash !== prevHash) {
      valid = false;
      errors.push(`Entry ${i} (${entry.entry_id}): chain hash mismatch`);
    }

    // Verify entry hash
    const { entry_hash, signature, ...baseEntry } = entry;
    const expectedHash = buildEntryHash(baseEntry);
    if (entry_hash !== expectedHash) {
      valid = false;
      errors.push(`Entry ${i} (${entry.entry_id}): entry_hash mismatch`);
    }

    // Verify signature
    const sigOk = hmacVerify(signingKey, { ...baseEntry, entry_hash }, signature);
    if (!sigOk) {
      valid = false;
      errors.push(`Entry ${i} (${entry.entry_id}): signature invalid`);
    }

    prevHash = entry_hash;
  }

  if (opts.json) {
    console.log(JSON.stringify({ valid, total_entries: entries.length, errors }));
  } else {
    console.log(bold('\n🔗  AI Passport — Audit Log Integrity Check\n'));
    if (valid) {
      success(`Audit log is intact (${entries.length} entries)`);
    } else {
      failure(`Audit log TAMPERED — ${errors.length} error(s):`);
      for (const e of errors) warn(`  ${e}`);
    }
    console.log();
  }

  if (!valid) process.exit(1);
}

export async function auditShowCommand(opts: ShowOptions): Promise<void> {
  let entries = readAuditLog();

  if (opts.passportId) {
    entries = entries.filter((e) => e.passport_id === opts.passportId);
  }

  if (opts.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  console.log(bold(`\n📋  AI Passport — Audit Trail (${entries.length} entries)\n`));
  if (entries.length === 0) {
    info('No audit entries found.');
    return;
  }

  for (const e of entries) {
    console.log(gray('─'.repeat(60)));
    info(`${e.timestamp}  [${e.passport_id.slice(0, 8)}…]`);
    console.log(`   Action : ${e.action}`);
    console.log(`   Scope  : ${e.scope_used}`);
    console.log(`   Result : ${e.result}`);
    console.log(`   Hash   : ${e.entry_hash.slice(0, 16)}…`);
  }
  console.log(gray('─'.repeat(60)));
  console.log();
}
