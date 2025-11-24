import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD || 'dev-encryption-key-change-in-prod';
const SALT = 'degixhub-salt'; // In production, use a proper random salt per user

// Derive a 32-byte key from the password
const ENCRYPTION_KEY = scryptSync(ENCRYPTION_PASSWORD, SALT, 32);

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encrypt(text: string): EncryptedData {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(encryptedData: EncryptedData): string {
  const ivBuffer = Buffer.from(encryptedData.iv, 'hex');
  const authTagBuffer = Buffer.from(encryptedData.authTag, 'hex');

  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
