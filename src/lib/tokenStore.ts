import fs from 'fs';
import path from 'path';

interface Tokens {
  at: string;
  rt: string;
  expiresAt: number;
}

const TOKENS_FILE = path.join(process.cwd(), 'tokens.json');

export function saveTokens(at: string, rt: string, expiresInDays: number = 30) {
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const data: Tokens = { at, rt, expiresAt };
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function loadTokens(): Tokens | null {
  if (!fs.existsSync(TOKENS_FILE)) {
    return null;
  }
  try {
    const content = fs.readFileSync(TOKENS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to read tokens from file", err);
    return null;
  }
}
