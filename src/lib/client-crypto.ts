// Client-side (browser) implementation of encryption/decryption
// This file should be imported in client components

// Generate a random salt for key derivation
export function generateSalt(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to derive a key from password and salt using PBKDF2
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  // Convert password and salt to Uint8Array
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const saltData = hexToUint8Array(salt);

  // Import the password as a key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive a key for AES-GCM
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 600000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Convert hex string to Uint8Array
function hexToUint8Array(hexString: string): Uint8Array {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.slice(i, i + 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to base64 string
function arrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

// Convert base64 string to Uint8Array
function base64ToArray(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the content
  const encoder = new TextEncoder();
  const contentBuffer = encoder.encode(content);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    contentBuffer
  );

  // Combine the IV and encrypted content
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const combinedArray = new Uint8Array(iv.length + encryptedArray.length);
  combinedArray.set(iv, 0);
  combinedArray.set(encryptedArray, iv.length);

  // Convert to base64 for storage
  const encryptedContent = arrayToBase64(combinedArray);

  return {
    encryptedContent,
    salt
  };
}

// Decrypt content using AES-GCM
export async function decryptContent(
  encryptedContent: string,
  password: string,
  salt: string
): Promise<string> {
  try {
    // Derive the same key from the password and salt
    const key = await deriveKey(password, salt);

    // Decode the base64 encrypted content
    const combinedArray = base64ToArray(encryptedContent);

    // Extract the IV (first 12 bytes) and the encrypted data
    const iv = combinedArray.slice(0, 12);
    const ciphertext = combinedArray.slice(12);

    // Decrypt the content
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    // Convert the decrypted buffer to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid password');
  }
} 