const ESC = '\x1b';

export const colors = {
  reset: `${ESC}[0m`,
  bold: `${ESC}[1m`,
  green: `${ESC}[32m`,
  red: `${ESC}[31m`,
  yellow: `${ESC}[33m`,
  cyan: `${ESC}[36m`,
  gray: `${ESC}[90m`,
  white: `${ESC}[37m`,
};

export function green(s: string): string { return `${colors.green}${s}${colors.reset}`; }
export function red(s: string): string { return `${colors.red}${s}${colors.reset}`; }
export function yellow(s: string): string { return `${colors.yellow}${s}${colors.reset}`; }
export function cyan(s: string): string { return `${colors.cyan}${s}${colors.reset}`; }
export function bold(s: string): string { return `${colors.bold}${s}${colors.reset}`; }
export function gray(s: string): string { return `${colors.gray}${s}${colors.reset}`; }

export function success(msg: string): void { console.log(green(`✓ ${msg}`)); }
export function failure(msg: string): void { console.error(red(`✗ ${msg}`)); }
export function warn(msg: string): void { console.warn(yellow(`⚠ ${msg}`)); }
export function info(msg: string): void { console.log(cyan(`ℹ ${msg}`)); }
