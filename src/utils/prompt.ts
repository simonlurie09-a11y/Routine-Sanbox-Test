import * as readline from 'readline';

export function createRl(): readline.Interface {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

export async function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function askRequired(rl: readline.Interface, question: string): Promise<string> {
  let answer = '';
  while (!answer.trim()) {
    answer = await ask(rl, question);
    if (!answer.trim()) console.log('  (required — please enter a value)');
  }
  return answer.trim();
}

export async function askOptional(rl: readline.Interface, question: string): Promise<string | undefined> {
  const answer = await ask(rl, question);
  return answer.trim() || undefined;
}

/** Parse expiry string like "30d", "6m", "1y" into a Date. */
export function parseExpiry(expiry: string): Date {
  const match = expiry.trim().match(/^(\d+)([dmy])$/i);
  if (!match) throw new Error(`Invalid expiry format "${expiry}". Use e.g. "30d", "6m", "1y".`);
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const now = new Date();
  if (unit === 'd') now.setDate(now.getDate() + n);
  else if (unit === 'm') now.setMonth(now.getMonth() + n);
  else if (unit === 'y') now.setFullYear(now.getFullYear() + n);
  return now;
}
