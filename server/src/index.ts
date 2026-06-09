import express from 'express';
import cors from 'cors';
import { env } from './config/env.ts';
import { agentRouter } from './routes/agent.ts';
import { memoryRouter } from './routes/memory.ts';
import { sealRouter } from './routes/seal.ts';
import { startAgentLoop } from './agents/runtime.ts';
import { requireX402Payment } from './x402/middleware.ts';

const app = express();

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/agent', agentRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/seal', sealRouter);

// Example protected route demonstrating x402 integration
app.get('/api/protected/data', requireX402Payment, (req, res) => {
  res.json({ data: 'Proprietary market alpha data' });
});

app.listen(env.PORT, () => {
  console.log(`Synapse server listening on port ${env.PORT}`);
  
  if (env.AUTO_START) {
    startAgentLoop();
  }
});
