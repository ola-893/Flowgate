import { Router } from 'express';
import { startAgentLoop, stopAgentLoop, getAgentStatus } from '../agents/runtime.ts';

export const agentRouter = Router();

agentRouter.post('/start', (req, res) => {
  startAgentLoop();
  res.json({ message: 'Agent started' });
});

agentRouter.post('/stop', (req, res) => {
  stopAgentLoop();
  res.json({ message: 'Agent stopped' });
});

agentRouter.get('/status', (req, res) => {
  res.json(getAgentStatus());
});
