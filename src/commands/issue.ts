import { v4 as uuidv4 } from 'uuid';
import { createRl, askRequired, askOptional, parseExpiry } from '../utils/prompt';
import { canonicalJson, hmacSign, identityHash, randomHex } from '../utils/crypto';
import { getSigningKey, savePassport, saveSalt } from '../utils/storage';
import { success, info, bold, cyan } from '../utils/colors';
import type { Passport, PassportConstraints } from '../types';

interface IssueOptions {
  json?: boolean;
  name?: string;
  email?: string;
  agent?: string;
  model?: string;
  scopes?: string;
  expiry?: string;
  maxTransaction?: string;
  allowedDomains?: string;
  activeHours?: string;
  nonInteractive?: boolean;
}

/** Detect if stdin is a terminal (interactive) or piped/redirected. */
function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY);
}

export async function issueCommand(opts: IssueOptions): Promise<void> {
  const interactive = isInteractive() && !opts.nonInteractive;
  const rl = interactive ? createRl() : null;

  const askReq = async (prompt: string, val?: string): Promise<string> => {
    if (val) return val;
    if (!rl) throw new Error(`Missing required option for non-interactive mode: ${prompt.trim()}`);
    return askRequired(rl, prompt);
  };
  const askOpt = async (prompt: string, val?: string): Promise<string | undefined> => {
    if (val !== undefined) return val || undefined;
    if (!rl) return undefined;
    return askOptional(rl, prompt);
  };

  try {
    if (interactive) console.log(bold('\n🛂  AI Passport — Issue New Credential\n'));

    // Principal identity
    const name = await askReq('  Principal name: ', opts.name);
    const email = await askReq('  Principal email: ', opts.email);
    const did = await askOpt('  DID or gov ID hash (optional, press Enter to skip): ');

    // Agent details
    const agentName = await askReq('  Agent name (e.g. Claude): ', opts.agent);
    const model = await askReq('  Agent model (e.g. claude-sonnet-4-6): ', opts.model);

    // Scopes
    const scopesRaw = await askReq('  Permitted scopes (comma-separated, e.g. email.read,banking.readonly): ', opts.scopes);
    const scopes = scopesRaw.split(',').map((s) => s.trim()).filter(Boolean);

    // Expiry
    const expiryStr = await askReq('  Expiry (e.g. 30d, 6m, 1y): ', opts.expiry);
    const expiresAt = parseExpiry(expiryStr);

    // Constraints
    if (interactive) console.log(cyan('\n  Optional constraints (press Enter to skip each):'));
    const maxTxRaw = await askOpt('    Max transaction USD: ', opts.maxTransaction);
    const domainsRaw = await askOpt('    Allowed domains (comma-separated): ', opts.allowedDomains);
    const hoursRaw = await askOpt('    Active hours UTC (e.g. 08:00-20:00): ', opts.activeHours);

    if (rl) rl.close();

    const constraints: PassportConstraints = {};
    if (maxTxRaw) {
      const val = parseFloat(maxTxRaw);
      if (isNaN(val) || val < 0) throw new Error('Invalid max_transaction_usd: must be a non-negative number');
      constraints.max_transaction_usd = val;
    }
    if (domainsRaw) constraints.allowed_domains = domainsRaw.split(',').map((d) => d.trim());
    if (hoursRaw) constraints.active_hours_utc = hoursRaw;

    // Build passport (without signature first, to sign all fields)
    const passportId = uuidv4();
    const agentId = uuidv4();
    const salt = randomHex(16);
    const idHash = identityHash(email, salt);
    const issuedAt = new Date().toISOString();

    const passportBody: Omit<Passport, 'signature'> = {
      passport_id: passportId,
      version: '1.0',
      issued_at: issuedAt,
      expires_at: expiresAt.toISOString(),
      principal: {
        name,
        email,
        identity_hash: idHash,
        ...(did ? { did } : {}),
      },
      agent: {
        name: agentName,
        model,
        agent_id: agentId,
      },
      scopes,
      ...(Object.keys(constraints).length > 0 ? { constraints } : {}),
      issuer_public_key_url: 'https://example.com/.well-known/ai-passport-key',
    };

    const signingKey = getSigningKey();
    const signature = hmacSign(signingKey, passportBody);

    const passport: Passport = { ...passportBody, signature };

    // Verify canonical signing covers all fields
    const signedPayload = canonicalJson(passportBody);
    if (!signedPayload) throw new Error('Failed to produce canonical JSON');

    // Persist
    saveSalt(passportId, salt);
    const filePath = savePassport(passport);

    if (opts.json) {
      console.log(JSON.stringify({ passport, file: filePath }, null, 2));
    } else {
      success(`Passport issued!`);
      info(`Passport ID : ${passportId}`);
      info(`Principal  : ${name} <${email}>`);
      info(`Agent      : ${agentName} / ${model}`);
      info(`Scopes     : ${scopes.join(', ')}`);
      info(`Expires    : ${expiresAt.toISOString()}`);
      info(`Saved to   : ${filePath}`);
    }
  } catch (err) {
    if (rl) rl.close();
    throw err;
  }
}
