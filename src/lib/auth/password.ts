import { compare, hash } from 'bcryptjs';

async function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export { comparePassword, hashPassword };
