import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const envSchema = z.object({
  SUI_NETWORK: z.enum(['mainnet', 'testnet', 'devnet', 'localnet']).default('testnet'),
  SUI_RPC_URL: z.string().url().default('https://fullnode.testnet.sui.io:443'),
  SUI_PRIVATE_KEY: z.string().min(1).optional(),
  SUI_DATA_GATE_PACKAGE_ID: z.string().min(1).default('0xb05b3964df8b88a86cda6b192893399966014af9dd6fc6beb26f1343a0495495'),
  MERCHANT_SUI_ADDRESS: z.string().min(1).default('0x0000000000000000000000000000000000000000000000000000000000001234'),
  STREAM_RATE: z.string().default('0.0001'), // SUI per second
  GEMINI_API_KEY: z.string().min(1).optional(),
  PORT: z.coerce.number().default(3001),
  AUTO_START: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);
