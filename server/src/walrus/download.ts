import { env } from '../config/env.ts';

/**
 * Downloads a blob from Walrus using its Blob ID.
 * @param blobId The string identifier of the blob.
 * @returns The raw byte array of the blob.
 */
export async function downloadFromWalrus(blobId: string): Promise<Uint8Array> {
  const response = await fetch(`${env.WALRUS_AGGREGATOR_URL}/v1/${blobId}`);

  if (!response.ok) {
    throw new Error(`Walrus download failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
