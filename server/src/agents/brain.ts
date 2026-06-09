import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.ts';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'mock-key');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface x402Decision {
  strategy: 'stream' | 'direct';
  negotiatedRate: string;
  reasoning: string;
}

/**
 * GeminiPaymentBrain: Decides optimal x402 payment strategy based on past MemWal context.
 * Ported from FlowPay architecture.
 */
export async function negotiatePaywall(
  apiRequirements: any,
  pastContext: any[]
): Promise<x402Decision> {
  // If no real API key is provided, return a mock decision for the hackathon
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'mock-key') {
    return {
      strategy: 'stream',
      negotiatedRate: '0.002 SUI',
      reasoning: 'MOCK: Chose streaming based on historical high-volume usage patterns.',
    };
  }

  const prompt = `
    You are an autonomous AI trading agent's payment brain.
    You encountered an HTTP 402 Payment Required response.
    
    API Requirements: ${JSON.stringify(apiRequirements)}
    Past MemWal Context (Your historical success rates with this or similar APIs):
    ${JSON.stringify(pastContext)}

    Decide whether to use a continuous "stream" payment (good for high volume/long duration) 
    or a "direct" single payment (good for one-offs).
    
    Respond in JSON format: { "strategy": "stream" | "direct", "negotiatedRate": string, "reasoning": string }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return JSON.parse(jsonStr) as x402Decision;
  } catch (e) {
    console.error('Failed to parse Gemini response', e);
    return { strategy: 'direct', negotiatedRate: 'max', reasoning: 'Fallback due to parsing error' };
  }
}
