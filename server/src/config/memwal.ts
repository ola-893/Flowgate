import { MemWal } from '@mysten-incubation/memwal';
import { env } from './env.ts';

// Singleton MemWal client, initialized once per server instance.
export const memwal = MemWal.create({
  key: env.MEMWAL_DELEGATE_KEY,
  accountId: env.MEMWAL_ACCOUNT_ID,
  serverUrl: env.MEMWAL_SERVER_URL,
  namespace: 'synapse-agent',
});
