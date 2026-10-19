import { v4 as uuidv4 } from 'uuid';
import { hmacSign, identityHash, randomHex } from '../utils/crypto';
import { getSigningKey, savePassport, saveSalt } from '../utils/storage';
import { buildVerificationPayload } from './verify';
import { auditLogCommand, auditVerifyCommand, auditShowCommand } from './audit';
import { bold, cyan, green, gray, info } from '../utils/colors';
import type { Passport } from '../types';

export async function demoCommand(opts: { json?: boolean }): Promise<void> {
  console.log(bold('\n🎬  AI Passport — Full System Demo\n'));
  console.log(gray('─'.repeat(60)));

  // Step 1: Issue a demo passport
  console.log(cyan('\n[1/4] Issuing demo passport…\n'));
  const passportId = uuidv4();
  const agentId = uuidv4();
  const salt = randomHex(16);
  const email = 'jane.smith@example.com';
  const idHash = identityHash(email, salt);
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);

  const passportBody: Omit<Passport, 'signature'> = {
    passport_id: passportId,
    version: '1.0',
    issued_at: now.toISOString(),
    expires_at: expires.toISOString(),
    principal: {
      name: 'Jane Smith',
      email,
      identity_hash: idHash,
    },
    agent: {
      name: 'Claude',
      model: 'claude-sonnet-4-6',
      agent_id: agentId,
    },
    scopes: ['email.read', 'calendar.write', 'banking.readonly'],
    constraints: {
      max_transaction_usd: 500,
      allowed_domains: ['gmail.com', 'calendar.google.com'],
    },
    issuer_public_key_url: 'https://example.com/.well-known/ai-passport-key',
  };

  const signingKey = getSigningKey();
  const signature = hmacSign(signingKey, passportBody);
  const passport: Passport = { ...passportBody, signature };

  saveSalt(passportId, salt);
  const filePath = savePassport(passport);

  console.log(green('  ✓ Passport issued'));
  info(`    ID      : ${passportId}`);
  info(`    For     : Jane Smith <${email}>`);
  info(`    Agent   : Claude / claude-sonnet-4-6`);
  info(`    Scopes  : email.read, calendar.write, banking.readonly`);
  info(`    Expires : ${expires.toISOString()}`);
  info(`    File    : ${filePath}`);

  // Step 2: Verify the passport
  console.log(cyan('\n[2/4] Verifying passport…\n'));
  const verifyResult = buildVerificationPayload(passport, 'email.read');
  if (verifyResult.valid) {
    console.log(green('  ✓ Passport is VALID'));
    info(`    Nonce   : ${verifyResult.verifier_nonce}`);
    info(`    Scopes  : ${verifyResult.authorized_scopes.join(', ')}`);
  } else {
    console.error(`  ✗ Verification failed: ${verifyResult.error}`);
  }

  // Step 3: Log fake actions
  console.log(cyan('\n[3/4] Logging simulated agent actions…\n'));

  await auditLogCommand(
    passportId,
    'Fetch inbox summary',
    'email.read',
    'Retrieved 12 unread messages from inbox',
    { json: false }
  );

  await auditLogCommand(
    passportId,
    'Create calendar event: Q1 Review',
    'calendar.write',
    'Event created at 2024-12-15T10:00:00Z',
    { json: false }
  );

  await auditLogCommand(
    passportId,
    'Check account balance',
    'banking.readonly',
    'Balance: $12,450.00 (read-only)',
    { json: false }
  );

  // Step 4: Show audit trail and verify integrity
  console.log(cyan('\n[4/4] Audit trail & integrity check…\n'));
  await auditShowCommand({ passportId });
  await auditVerifyCommand({ json: false });

  if (opts.json) {
    console.log(JSON.stringify({
      demo_passport_id: passportId,
      verification: verifyResult,
      passport_file: filePath,
    }, null, 2));
  } else {
    console.log(gray('─'.repeat(60)));
    console.log(bold('\n✅  Demo complete! The full AI Passport lifecycle ran in seconds.\n'));
    console.log('   Commands to explore:');
    console.log('   ai-passport issue          — issue a new passport interactively');
    console.log('   ai-passport verify <id>    — verify a passport');
    console.log('   ai-passport audit show     — view the audit trail');
    console.log('   ai-passport revoke <id>    — revoke a passport');
    console.log('   ai-passport serve          — start verification server');
    console.log();
  }
}
