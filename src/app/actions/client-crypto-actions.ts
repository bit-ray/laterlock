'use client';

import * as ClientCrypto from '@/lib/client-crypto';

export async function encryptWithPassword(content: string, password: string): Promise<{
  encryptedContent: string;
  salt: string;
}> {
  try {
    if (!password) {
      throw new Error('Password is required for encryption');
    }

    return await ClientCrypto.encryptContent(content, password);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt content');
  }
}

export async function decryptWithPassword(
  encryptedContent: string,
  password: string,
  salt: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    if (!salt) {
      return { success: false, error: 'Missing encryption parameter (salt)' };
    }

    const decrypted = await ClientCrypto.decryptContent(encryptedContent, password, salt);
    return { success: true, data: decrypted };
  } catch (error) {
    console.warn('Decryption error:', error);
    return {
      success: false,
      error: 'Wrong password'
    };
  }
} 