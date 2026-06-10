import express from 'express';
import cors from 'cors';
import { requireX402Payment } from './x402/middleware.ts';

const PORT = parseInt(process.env.PORT || '3001');
const app = express();

app.use(cors());
app.use(express.json());

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StreamEngine Gateway' });
});

// --- Premium endpoints protected by x402 Payment Required ---
// Each endpoint simulates a registered website on the marketplace.

app.get('/api/premium/alpha-signals/v1/btc', requireX402Payment, (req, res) => {
  const auth = (req as any).streamEngineAuth;
  console.log(`[Gateway] Serving alpha-signals data to agent ${auth?.agentAddress || 'unknown'}`);
  res.json({
    provider: 'Alpha Signals Inc.',
    endpoint: '/api/premium/alpha-signals/v1/btc',
    data: {
      timestamp: new Date().toISOString(),
      signal: 'STRONG_BUY',
      confidence: 0.87,
      predicted_price_24h: 108542.50,
      features: ['on-chain whale activity', 'options flow', 'funding rates'],
      note: 'This data was gated by StreamEngine x402. Your payment stream is active.'
    }
  });
});

app.get('/api/premium/medical/trials', requireX402Payment, (req, res) => {
  const auth = (req as any).streamEngineAuth;
  console.log(`[Gateway] Serving medical trials data to agent ${auth?.agentAddress || 'unknown'}`);
  res.json({
    provider: 'Longevity Research Corp.',
    endpoint: '/api/premium/medical/trials',
    data: {
      trial_id: 'NCT-2025-LNG-0042',
      compound: 'Rapamycin-7b',
      phase: 'Phase III',
      efficacy_score: 0.73,
      sample_size: 2400,
      note: 'This data was gated by StreamEngine x402. Your payment stream is active.'
    }
  });
});

app.get('/api/premium/legal/precedents', requireX402Payment, (req, res) => {
  const auth = (req as any).streamEngineAuth;
  console.log(`[Gateway] Serving legal precedents data to agent ${auth?.agentAddress || 'unknown'}`);
  res.json({
    provider: 'LexAI Data Services',
    endpoint: '/api/premium/legal/precedents',
    data: {
      case_id: 'NYT-v-OpenAI-2024',
      ruling: 'Fair use defense rejected for commercial LLM training',
      relevance_score: 0.94,
      jurisdiction: 'S.D.N.Y.',
      note: 'This data was gated by StreamEngine x402. Your payment stream is active.'
    }
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`\n🚀 StreamEngine Gateway listening on http://localhost:${PORT}`);
  console.log(`   Premium endpoints:`);
  console.log(`   → GET /api/premium/alpha-signals/v1/btc`);
  console.log(`   → GET /api/premium/medical/trials`);
  console.log(`   → GET /api/premium/legal/precedents`);
  console.log(`   All endpoints return 402 Payment Required without a valid stream.\n`);
});
