'use server';

import { decryptContent } from '@/lib/crypto';

// This function provides more detailed error messages for client-side use
export async function decryptWithErrorDetails(
  encryptedContent: string,
  password: string,
  salt: string,
) {
  try {
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    if (!salt) {
      return { success: false, error: 'Missing encryption parameter (salt)' };
    }

    const decrypted = await decryptContent(encryptedContent, password, salt);
    return { success: true, data: decrypted };
  } catch (error) {
    console.error('Decryption error with details:', error);
    return {
      success: false,
      error: 'Invalid password or corrupted data'
    };
  }
} 