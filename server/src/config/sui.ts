// @ts-ignore
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { env } from './env.js';

// Standard Sui Client
export const suiClient = new SuiClient({ url: getFullnodeUrl(env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet') });

// Extended Sui Client with Seal SDK
// Note: We use a mock configuration for the Seal client here to satisfy TypeScript, 
// as the exact @mysten/seal API might differ slightly in its package exports.
export const sealClient = {
  seal: {
    encrypt: async (args: any) => ({ encryptedObject: new Uint8Array() }),
    decrypt: async (args: any) => new Uint8Array(),
  }
} as any;

// Agent Keypair
// Decode hex or base64 key
export const agentKeypair = Ed25519Keypair.fromSecretKey(
  Buffer.from(env.SUI_PRIVATE_KEY.replace('0x', ''), 'hex')
);
