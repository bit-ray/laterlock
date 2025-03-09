// IMPORTANT: This file contains server-side only code and should not be imported directly in client components
// Use server actions to call these functions from client components

import crypto from 'crypto';

// System key for encrypting non-password protected content
// This is a constant key used for all non-password protected content
// In a production environment, this should be stored in environment variables
const SYSTEM_KEY = process.env.LATERLOCK_SYSTEM_KEY || 'DEVELOPMENT';

// Generate a random salt for key derivation
export function generateSalt(): string {
  const array = crypto.randomBytes(16);
  return array.toString('hex');
}

// Helper function to derive a key from password and salt using PBKDF2
// This matches the client-side implementation
async function deriveKey(password: string, salt: string): Promise<Buffer> {
  // Convert salt from hex to Buffer
  const saltBuffer = hexToBuffer(salt);

  // Derive a key using PBKDF2 with SHA-256
  // This matches the client-side implementation which uses:
  // - PBKDF2 with SHA-256
  // - 600000 iterations
  // - 32 bytes (256 bits) key length
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, saltBuffer, 600000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

// Convert hex string to Buffer
function hexToBuffer(hexString: string): Buffer {
  return Buffer.from(hexString, 'hex');
}

// Convert Buffer to base64 string
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

// Convert base64 string to Buffer
function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}

// Encrypt content using AES-GCM
export async function encryptContent(content: string, password: string): Promise<{
  encryptedContent: string;
  salt: string;
}> {
  const salt = generateSalt();

  // Derive a key from the password and salt
  const key = await deriveKey(password, salt);

  // Generate an initialization vector (IV)
  const iv = crypto.randomBytes(12);

  // Create cipher using AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // Encrypt the content
  let encrypted = cipher.update(Buffer.from(content, 'utf8'));
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Get the auth tag
  const authTag = cipher.getAuthTag();

  // Combine the IV, encrypted content, and auth tag
  // Note: In Node.js, we need to explicitly handle the auth tag
  // Client-side Web Crypto API includes the auth tag in the encrypted result
  const combinedArray = Buffer.concat([iv, encrypted, authTag]);

  // Convert to base64 for storage
  const encryptedContent = bufferToBase64(combinedArray);

  return {
    encryptedContent,
    salt
  };
}

// Encrypt content with system key (for non-password protected content)
export async function encryptWithSystemKey(content: string): Promise<{
  encryptedContent: string;
  salt: string;
}> {
  // Use the system key instead of a user-provided password
  return encryptContent(content, SYSTEM_KEY);
}

// Decrypt content using AES-GCM
export async function decryptContent(
  encryptedContent: string,
  password: string,
  salt: string,
): Promise<string> {
  try {
    // Derive the same key from the password and salt
    const key = await deriveKey(password, salt);

    // Decode the base64 encrypted content
    const combinedArray = base64ToBuffer(encryptedContent);

    // Extract the IV (first 12 bytes), the encrypted data, and the auth tag (last 16 bytes)
    const iv = combinedArray.slice(0, 12);
    const authTag = combinedArray.slice(combinedArray.length - 16);
    const ciphertext = combinedArray.slice(12, combinedArray.length - 16);

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the content
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Convert the decrypted buffer to a string
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid password');
  }
}

// Decrypt content that was encrypted with the system key
export async function decryptWithSystemKey(
  encryptedContent: string,
  salt: string,
): Promise<string> {
  return await decryptContent(encryptedContent, SYSTEM_KEY, salt);
}
