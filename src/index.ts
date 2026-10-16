#!/usr/bin/env node
import { Command } from 'commander';
import { issueCommand } from './commands/issue';
import { verifyCommand } from './commands/verify';
import { auditLogCommand, auditVerifyCommand, auditShowCommand } from './commands/audit';
import { revokeCommand, listRevocationsCommand } from './commands/revoke';
import { serveCommand } from './commands/serve';
import { demoCommand } from './commands/demo';
import { listCommand } from './commands/list';

const program = new Command();

program
  .name('ai-passport')
  .description('Cryptographically verifiable credentials for AI agents')
  .version('1.0.0');

// Issue
program
  .command('issue')
  .description('Issue a new AI Passport interactively')
  .option('--json', 'Machine-readable JSON output')
  .option('--name <name>', 'Principal name')
  .option('--email <email>', 'Principal email')
  .option('--agent <agent>', 'Agent name')
  .option('--model <model>', 'Agent model')
  .option('--scopes <scopes>', 'Comma-separated scopes')
  .option('--expiry <expiry>', 'Expiry duration (e.g. 30d, 6m, 1y)')
  .option('--max-transaction <usd>', 'Max transaction USD constraint')
  .option('--allowed-domains <domains>', 'Comma-separated allowed domains constraint')
  .option('--active-hours <hours>', 'Active hours UTC constraint (e.g. 08:00-20:00)')
  .option('--non-interactive', 'Skip all interactive prompts (all required flags must be provided)')
  .action(issueCommand);

// Verify
program
  .command('verify <passportIdOrPath>')
  .description('Verify a passport by ID or file path')
  .option('--json', 'Machine-readable JSON output')
  .option('--scope <scope>', 'Check if a specific scope is authorized')
  .action(verifyCommand);

// Audit sub-commands
const auditCmd = program
  .command('audit')
  .description('Audit trail management');

auditCmd
  .command('log <passportId> <action> <scope> <result>')
  .description('Append an action entry to the audit trail')
  .option('--json', 'Machine-readable JSON output')
  .action(auditLogCommand);

auditCmd
  .command('verify')
  .description('Verify audit log chain integrity')
  .option('--json', 'Machine-readable JSON output')
  .action(auditVerifyCommand);

auditCmd
  .command('show')
  .description('Display the audit trail')
  .option('--json', 'Machine-readable JSON output')
  .option('--passport-id <id>', 'Filter by passport ID')
  .action(auditShowCommand);

// Revoke
program
  .command('revoke <passportId>')
  .description('Revoke a passport')
  .option('--json', 'Machine-readable JSON output')
  .option('--reason <reason>', 'Reason for revocation')
  .action(revokeCommand);

program
  .command('revocations')
  .description('List all revoked passports')
  .option('--json', 'Machine-readable JSON output')
  .action(listRevocationsCommand);

// List
program
  .command('list')
  .description('List all stored passports')
  .option('--json', 'Machine-readable JSON output')
  .action(listCommand);

// Serve
program
  .command('serve')
  .description('Start the verification HTTP server')
  .option('--port <port>', 'Port to listen on', '3000')
  .action(serveCommand);

// Demo
program
  .command('demo')
  .description('Run an end-to-end demo: issue, verify, audit, check integrity')
  .option('--json', 'Machine-readable JSON output')
  .action(demoCommand);

program.parse(process.argv);
