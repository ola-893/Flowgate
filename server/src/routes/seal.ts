import { Router } from 'express';
import { encryptMemory } from '../seal/encrypt.ts';
import { env } from '../config/env.ts';

export const sealRouter = Router();

sealRouter.post('/encrypt', async (req, res) => {
  try {
    const { text } = req.body;
    const encrypted = await encryptMemory(text);
    res.json({ encrypted });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

sealRouter.get('/vault', (req, res) => {
  res.json({
    vaultId: env.SEAL_VAULT_OBJECT_ID,
    packageId: env.SEAL_PACKAGE_ID,
    keyServers: [env.SEAL_KEY_SERVER_1, env.SEAL_KEY_SERVER_2]
  });
});

// Decryption requires client-side wallet signatures, so it's typically handled
// directly on the frontend, or via a proxy route if session keys are sent here.
// For Synapse, we expect the React dashboard to handle decryption via SDK.
