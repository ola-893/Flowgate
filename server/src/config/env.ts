import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const envSchema = z.object({
  SUI_NETWORK: z.enum(['mainnet', 'testnet', 'devnet', 'localnet']).default('testnet'),
  SUI_PRIVATE_KEY: z.string().min(1),
  MEMWAL_DELEGATE_KEY: z.string().min(1),
  MEMWAL_ACCOUNT_ID: z.string().min(1),
  MEMWAL_SERVER_URL: z.string().url().default('https://relayer-staging.memory.walrus.xyz'),
  WALRUS_PUBLISHER_URL: z.string().url().default('https://publisher.walrus-testnet.walrus.space'),
  WALRUS_AGGREGATOR_URL: z.string().url().default('https://aggregator.walrus-testnet.walrus.space'),
  SEAL_PACKAGE_ID: z.string().min(1).default('0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d'),
  SEAL_VAULT_OBJECT_ID: z.string().min(1).default('0x_placeholder_vault_id'),
  SEAL_KEY_SERVER_1: z.string().min(1).default('0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75'), // mysten-testnet-1
  SEAL_KEY_SERVER_2: z.string().min(1).default('0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8'), // mysten-testnet-2
  GEMINI_API_KEY: z.string().min(1).optional(),
  PORT: z.coerce.number().default(3001),
  AUTO_START: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);
