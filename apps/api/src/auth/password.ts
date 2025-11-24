import { hash, verify } from '@node-rs/argon2';

// Argon2 configuration (recommended by OWASP)
const hashingConfig = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, hashingConfig);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return verify(hash, password);
}
