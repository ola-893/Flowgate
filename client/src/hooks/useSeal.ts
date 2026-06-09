import { useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { SessionKey } from '@mysten/seal';

const seal = (config: any) => config;

export function useSeal() {
  const suiClient = useSuiClient();
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);

  // Initialize the extended Seal client
  const sealClient = (suiClient as any).$extend(seal({
    serverConfigs: [
      { objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', weight: 1 },
      { objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', weight: 1 }
    ]
  }));

  const decryptData = async (encryptedData: Uint8Array, txBytes: Uint8Array) => {
    if (!sessionKey) throw new Error("No active session key");

    const decrypted = await sealClient.seal.decrypt({
      data: encryptedData,
      sessionKey,
      txBytes,
    });
    
    return new TextDecoder().decode(decrypted);
  };

  return { sealClient, sessionKey, setSessionKey, decryptData };
}
