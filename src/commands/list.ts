import { listPassports } from '../utils/storage';
import { info, bold, green, red, gray } from '../utils/colors';
import { isRevoked } from '../utils/storage';

interface ListOptions {
  json?: boolean;
}

export async function listCommand(opts: ListOptions): Promise<void> {
  const passports = listPassports();

  if (opts.json) {
    console.log(JSON.stringify(passports, null, 2));
    return;
  }

  console.log(bold(`\n📂  AI Passport — Stored Passports (${passports.length})\n`));
  if (passports.length === 0) {
    info('No passports found. Run `ai-passport issue` to create one.');
    return;
  }

  for (const p of passports) {
    const expired = new Date() > new Date(p.expires_at);
    const revoked = isRevoked(p.passport_id);
    const status = revoked ? red('REVOKED') : expired ? red('EXPIRED') : green('VALID');
    console.log(gray('─'.repeat(60)));
    console.log(`  [${status}] ${p.passport_id}`);
    info(`  Principal : ${p.principal.name} <${p.principal.email}>`);
    info(`  Agent     : ${p.agent.name} / ${p.agent.model}`);
    info(`  Scopes    : ${p.scopes.join(', ')}`);
    info(`  Expires   : ${p.expires_at}`);
  }
  console.log(gray('─'.repeat(60)));
  console.log();
}
