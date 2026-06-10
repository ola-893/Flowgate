import express from 'express';
import cors from 'cors';
import { requireX402Payment } from './x402/middleware.ts';
import {
  getProviderById,
  getProviderEarnings,
  getProviders,
  registerProvider,
} from './registry/providers.ts';
import { readStreamObjectState } from './x402/streams.ts';

const PORT = parseInt(process.env.PORT || '3001');
const app = express();

app.use(cors());
app.use(express.json());

// ============================================================
//  PUBLIC API — Marketplace Registry (no payment required)
// ============================================================

/** List all registered providers */
function listProviders(req: express.Request, res: express.Response) {
  res.json({ providers: getProviders() });
}

/** Register a new provider endpoint */
function createProvider(req: express.Request, res: express.Response) {
  const { providerAddress, name, endpoint, ratePerSecond, description, category } = req.body;
  if (!providerAddress || !name || !endpoint || !ratePerSecond) {
    return res.status(400).json({ error: 'Missing required fields: providerAddress, name, endpoint, ratePerSecond' });
  }
  const listing = registerProvider({ providerAddress, name, endpoint, ratePerSecond, description: description || '', category: category || 'General' });
  res.status(201).json(listing);
}

app.get('/api/providers', listProviders);

app.get('/api/registry/providers', listProviders);

app.post('/api/providers', createProvider);

/** Get a specific provider */
app.get('/api/registry/providers/:id', (req, res) => {
  const provider = getProviderById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });
  res.json(provider);
});

/** Register a new provider endpoint */
app.post('/api/registry/providers', createProvider);

/** Read live StreamObject balance from Sui RPC */
app.get('/api/streams/:id/balance', async (req, res) => {
  try {
    const stream = await readStreamObjectState(req.params.id);
    const balanceMist = Number(stream.balanceMist);
    res.json({
      streamId: stream.streamId,
      balanceMist,
      balanceSui: balanceMist / 1_000_000_000,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(404).json({ error: 'Stream not found', message });
  }
});

/** Return provider earnings accumulated by successful access grants */
app.get('/api/providers/:id/earnings', (req, res) => {
  const earnings = getProviderEarnings(req.params.id);
  if (!earnings) return res.status(404).json({ error: 'Provider not found' });
  res.json({
    providerId: req.params.id,
    totalEarnedMist: earnings.totalEarnedMist,
  });
});

/** Health check */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StreamEngine Gateway', providers: getProviders().length });
});

// ============================================================
//  PREMIUM ENDPOINTS — Protected by x402 Payment Required
// ============================================================

app.get('/api/premium/alpha-signals/v1/btc', requireX402Payment, (req, res) => {
  const auth = (req as any).streamEngineAuth;
  console.log(`[Gateway] Serving alpha-signals to agent ${auth?.agentAddress?.substring(0, 10) || 'unknown'}...`);
  res.json({
    provider: 'Alpha Signals Inc.',
    endpoint: '/api/premium/alpha-signals/v1/btc',
    data: {
      timestamp: new Date().toISOString(),
      signal: 'STRONG_BUY',
      confidence: 0.87,
      predicted_price_24h: 108542.50,
      features: ['on-chain whale activity', 'options flow', 'funding rates'],
    }
  });
});

app.get('/api/premium/medical/trials', requireX402Payment, (req, res) => {
  const auth = (req as any).streamEngineAuth;
  console.log(`[Gateway] Serving medical trials to agent ${auth?.agentAddress?.substring(0, 10) || 'unknown'}...`);
  res.json({
    provider: 'Longevity Research Corp.',
    endpoint: '/api/premium/medical/trials',
    data: {
      trial_id: 'NCT-2025-LNG-0042',
      compound: 'Rapamycin-7b',
      phase: 'Phase III',
      efficacy_score: 0.73,
      sample_size: 2400,
    }
  });
});

app.get('/api/premium/legal/precedents', requireX402Payment, (req, res) => {
  const auth = (req as any).streamEngineAuth;
  console.log(`[Gateway] Serving legal precedents to agent ${auth?.agentAddress?.substring(0, 10) || 'unknown'}...`);
  res.json({
    provider: 'LexAI Data Services',
    endpoint: '/api/premium/legal/precedents',
    data: {
      case_id: 'NYT-v-OpenAI-2024',
      ruling: 'Fair use defense rejected for commercial LLM training',
      relevance_score: 0.94,
      jurisdiction: 'S.D.N.Y.',
    }
  });
});

// ============================================================
//  START
// ============================================================

app.listen(PORT, () => {
  const providers = getProviders();
  console.log(`\n🚀 StreamEngine Gateway listening on http://localhost:${PORT}`);
  console.log(`\n📋 Registry: ${providers.length} providers registered`);
  providers.forEach(p => {
    console.log(`   → ${p.name} | ${p.ratePerSecond} SUI/sec | GET ${p.endpoint}`);
  });
  console.log(`\n🔒 All premium endpoints return 402 Payment Required without a valid stream.`);
  console.log(`📖 Browse providers: GET /api/registry/providers\n`);
});
