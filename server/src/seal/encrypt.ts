import { sealClient } from '../config/sui.ts';
import { env } from '../config/env.ts';

/**
 * Encrypts data using Seal threshold encryption with the MemoryVault policy.
 * @param plaintext The string data to encrypt.
 * @returns The EncryptedObject ready to be stored on Walrus.
 */
export async function encryptMemory(plaintext: string) {
  const data = new TextEncoder().encode(plaintext);
  
  const { encryptedObject } = await sealClient.seal.encrypt({
    threshold: 2,
    packageId: env.SEAL_PACKAGE_ID,
    id: env.SEAL_VAULT_OBJECT_ID,
    data,
  });
  
  return encryptedObject;
}
