import { SessionKey } from '@mysten/seal';
import { sealClient } from '../config/sui.ts';

/**
 * Decrypts data using Seal threshold decryption.
 * @param encryptedData The EncryptedObject data (bytes) fetched from Walrus.
 * @param sessionKey The SessionKey authorized by the operator.
 * @param txBytes The serialized transaction block proving OperatorCap ownership.
 * @returns The decrypted plaintext string.
 */
export async function decryptMemory(
  encryptedData: Uint8Array,
  sessionKey: SessionKey,
  txBytes: Uint8Array
): Promise<string> {
  const decryptedData = await sealClient.seal.decrypt({
    data: encryptedData,
    sessionKey,
    txBytes,
  });

  return new TextDecoder().decode(decryptedData);
}
