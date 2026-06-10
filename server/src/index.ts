import express from 'express';
import cors from 'cors';
import { requireX402Payment } from './x402/middleware.ts';
import { getProviders, getProviderById, registerProvider } from './registry/providers.ts';

const PORT = parseInt(process.env.PORT || '3001');
const app = express();

app.use(cors());
app.use(express.json());

// ============================================================
//  PUBLIC API — Marketplace Registry (no payment required)
// ============================================================

/** List all registered providers */
app.get('/api/registry/providers', (req, res) => {
  res.json({ providers: getProviders() });
});

/** Get a specific provider */
app.get('/api/registry/providers/:id', (req, res) => {
  const provider = getProviderById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });
  res.json(provider);
});

/** Register a new provider endpoint */
app.post('/api/registry/providers', (req, res) => {
  const { providerAddress, name, endpoint, ratePerSecond, description, category } = req.body;
  if (!providerAddress || !name || !endpoint || !ratePerSecond) {
    return res.status(400).json({ error: 'Missing required fields: providerAddress, name, endpoint, ratePerSecond' });
  }
  const listing = registerProvider({ providerAddress, name, endpoint, ratePerSecond, description: description || '', category: category || 'General' });
  res.status(201).json(listing);
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
