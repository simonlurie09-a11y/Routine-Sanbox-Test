import { getRevocationList, saveRevocationList, isRevoked } from '../utils/storage';
import { success, failure, info, bold, warn } from '../utils/colors';

interface RevokeOptions {
  json?: boolean;
  reason?: string;
}

interface ListRevocationsOptions {
  json?: boolean;
}

export async function revokeCommand(passportId: string, opts: RevokeOptions): Promise<void> {
  if (isRevoked(passportId)) {
    if (opts.json) {
      console.log(JSON.stringify({ revoked: false, error: 'Already revoked', passport_id: passportId }));
    } else {
      warn(`Passport ${passportId} is already revoked.`);
    }
    return;
  }

  const list = getRevocationList();
  list.revoked.push({
    passport_id: passportId,
    revoked_at: new Date().toISOString(),
    ...(opts.reason ? { reason: opts.reason } : {}),
  });
  saveRevocationList(list);

  if (opts.json) {
    console.log(JSON.stringify({ revoked: true, passport_id: passportId, revoked_at: new Date().toISOString() }));
  } else {
    success(`Passport ${passportId} has been revoked.`);
    if (opts.reason) info(`Reason: ${opts.reason}`);
  }
}

export async function listRevocationsCommand(opts: ListRevocationsOptions): Promise<void> {
  const list = getRevocationList();

  if (opts.json) {
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  console.log(bold(`\n🚫  AI Passport — Revocation List (${list.revoked.length} entries)\n`));
  if (list.revoked.length === 0) {
    info('No revoked passports.');
    return;
  }
  for (const r of list.revoked) {
    failure(`${r.passport_id}  (revoked ${r.revoked_at}${r.reason ? ` — ${r.reason}` : ''})`);
  }
  console.log();
}
