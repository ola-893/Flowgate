import { SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { Keypair } from '@mysten/sui/cryptography';
import { suiClient } from '../config/sui.ts';
import { env } from '../config/env.ts';

/**
 * Creates a short-lived session key for decryption.
 * @param address The address of the user requesting decryption.
 * @param signer The user's keypair to sign the session creation.
 * @returns The initialized SessionKey.
 */
export async function createSessionKey(address: string, signer: Keypair): Promise<SessionKey> {
  return await SessionKey.create({
    address,
    packageId: env.SEAL_PACKAGE_ID,
    ttlMin: 15,
    signer,
    suiClient,
  });
}

/**
 * Builds the transaction block that calls the `seal_approve_memory` Move function.
 * @param operatorCapId The Object ID of the OperatorCap held by the user.
 * @returns Serialized transaction bytes.
 */
export async function buildApprovalTransaction(operatorCapId: string): Promise<Uint8Array> {
  const tx = new Transaction();
  
  // The identity vector is required by Seal's standard signature
  const idBytes = new TextEncoder().encode('memory-access');
  
  tx.moveCall({
    target: `${env.SEAL_PACKAGE_ID}::access_control::seal_approve_memory`,
    arguments: [
      tx.pure.vector('u8', idBytes),
      tx.object(env.SEAL_VAULT_OBJECT_ID),
      tx.object(operatorCapId),
    ],
  });

  return await tx.build({ client: suiClient });
}
