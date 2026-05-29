import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { warn } from './colors';
import { generateSigningKey } from './crypto';
import type { Passport, RevocationList, AuditEntry } from '../types';

export const AI_PASSPORT_DIR = path.join(os.homedir(), '.ai-passport');
const KEYS_DIR = path.join(AI_PASSPORT_DIR, 'keys');
const SALTS_DIR = path.join(AI_PASSPORT_DIR, 'salts');
const PASSPORTS_DIR = path.join(AI_PASSPORT_DIR, 'passports');
const REVOCATION_FILE = path.join(AI_PASSPORT_DIR, 'revocation-list.json');
const AUDIT_FILE = path.join(AI_PASSPORT_DIR, 'passport-audit.log');
const SIGNING_KEY_FILE = path.join(KEYS_DIR, 'signing.key');

export function ensureStorageInit(): void {
  for (const dir of [AI_PASSPORT_DIR, KEYS_DIR, SALTS_DIR, PASSPORTS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  }
  if (!fs.existsSync(REVOCATION_FILE)) {
    fs.writeFileSync(REVOCATION_FILE, JSON.stringify({ revoked: [] }, null, 2), { mode: 0o600 });
  }
  if (!fs.existsSync(AUDIT_FILE)) {
    fs.writeFileSync(AUDIT_FILE, '', { mode: 0o600 });
  }
}

export function getSigningKey(): Buffer {
  ensureStorageInit();
  if (!fs.existsSync(SIGNING_KEY_FILE)) {
    const key = generateSigningKey();
    fs.writeFileSync(SIGNING_KEY_FILE, key.toString('hex'), { mode: 0o600 });
    return key;
  }
  const hex = fs.readFileSync(SIGNING_KEY_FILE, 'utf8').trim();
  return Buffer.from(hex, 'hex');
}

export function checkFilePermissions(filePath: string): void {
  try {
    const stat = fs.statSync(filePath);
    const mode = stat.mode & 0o777;
    // Warn if group or other can read/write
    if (mode & 0o077) {
      warn(`Passport file ${filePath} has overly permissive permissions (${mode.toString(8)}). Run: chmod 600 "${filePath}"`);
    }
  } catch {
    // File doesn't exist yet; no-op
  }
}

export function savePassport(passport: Passport): string {
  ensureStorageInit();
  const filePath = path.join(PASSPORTS_DIR, `${passport.passport_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(passport, null, 2), { mode: 0o600 });
  return filePath;
}

export function loadPassport(passportIdOrPath: string): Passport {
  let filePath = passportIdOrPath;
  if (!fs.existsSync(filePath)) {
    // Try as ID in passports dir
    filePath = path.join(PASSPORTS_DIR, `${passportIdOrPath}.json`);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`Passport not found: ${passportIdOrPath}`);
  }
  checkFilePermissions(filePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Passport;
}

export function listPassports(): Passport[] {
  ensureStorageInit();
  return fs.readdirSync(PASSPORTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(PASSPORTS_DIR, f), 'utf8')) as Passport);
}

export function saveSalt(passportId: string, salt: string): void {
  ensureStorageInit();
  const saltFile = path.join(SALTS_DIR, `${passportId}.salt`);
  fs.writeFileSync(saltFile, salt, { mode: 0o600 });
}

export function loadSalt(passportId: string): string {
  const saltFile = path.join(SALTS_DIR, `${passportId}.salt`);
  if (!fs.existsSync(saltFile)) throw new Error(`Salt not found for passport: ${passportId}`);
  return fs.readFileSync(saltFile, 'utf8').trim();
}

export function getRevocationList(): RevocationList {
  ensureStorageInit();
  return JSON.parse(fs.readFileSync(REVOCATION_FILE, 'utf8')) as RevocationList;
}

export function saveRevocationList(list: RevocationList): void {
  fs.writeFileSync(REVOCATION_FILE, JSON.stringify(list, null, 2), { mode: 0o600 });
}

export function isRevoked(passportId: string): boolean {
  const list = getRevocationList();
  return list.revoked.some((r) => r.passport_id === passportId);
}

export function appendAuditEntry(entry: AuditEntry): void {
  ensureStorageInit();
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');
}

export function readAuditLog(): AuditEntry[] {
  ensureStorageInit();
  const content = fs.readFileSync(AUDIT_FILE, 'utf8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).map((line) => JSON.parse(line) as AuditEntry);
}

export function getAuditLogPath(): string {
  return AUDIT_FILE;
}

export function getPassportsDir(): string {
  return PASSPORTS_DIR;
}
