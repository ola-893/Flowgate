import { Request, Response, NextFunction } from 'express';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

const SUI_RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.SUI_DATA_GATE_PACKAGE_ID || '0xb05b3964df8b88a86cda6b192893399966014af9dd6fc6beb26f1343a0495495';
const client = new SuiJsonRpcClient({ url: SUI_RPC_URL });

/**
 * Express middleware that enforces x402 Payment Required for AI agent access.
 * 
 * Checks for a valid StreamObject on Sui testnet via RPC read (no consensus contention).
 * If the stream has a positive balance, the request is allowed through.
 * If no valid payment proof exists, returns HTTP 402 with payment requirements.
 */
export async function requireX402Payment(req: Request, res: Response, next: NextFunction) {
  // Support both header naming conventions
  const streamId = (req.headers['x-streamengine-stream-id'] || req.headers['x-flowpay-stream-id']) as string;
  const txDigest = (req.headers['x-streamengine-tx-digest'] || req.headers['x-flowpay-tx-digest']) as string;

  if (streamId) {
      // Validate the stream object via RPC (no consensus contention — fast read)
      try {
          const objectData = await client.getObject({
              id: streamId,
              options: { showContent: true }
          });

          if (objectData.data && objectData.data.content?.dataType === 'moveObject') {
              const fields = objectData.data.content.fields as any;
              const balance = BigInt(fields.balance);
              if (balance > 0n) {
                  console.log(`[Middleware] ✅ Valid stream ${streamId} found with balance: ${balance}`);
                  (req as any).streamEngineAuth = {
                      streamId,
                      agentAddress: fields.sender,
                      balance: balance.toString(),
                  };
                  return next();
              } else {
                  console.log(`[Middleware] ❌ Stream ${streamId} balance is 0 — access revoked.`);
              }
          }
      } catch (e: any) {
          console.error(`[Middleware] Error querying stream ${streamId}:`, e.message);
      }
  } else if (txDigest) {
      // Fast-Path: verify a direct payment transaction
      try {
          const tx = await client.getTransactionBlock({
              digest: txDigest,
              options: { showEffects: true, showInput: true }
          });
          if (tx.effects?.status.status === 'success') {
              console.log(`[Middleware] ✅ Valid Fast-Path payment found: ${txDigest}`);
              return next();
          }
      } catch (e: any) {
          console.error(`[Middleware] Error verifying tx ${txDigest}:`, e.message);
      }
  }

  // No valid payment — return 402 Payment Required
  const merchantAddress = process.env.MERCHANT_SUI_ADDRESS || '0x0000000000000000000000000000000000000000000000000000000000001234';
  const ratePerSecond = process.env.STREAM_RATE || '0.0001';
  
  res.set('X-StreamEngine-Mode', 'streaming');
  res.set('X-StreamEngine-Rate', ratePerSecond);
  res.set('X-StreamEngine-Recipient', merchantAddress);

  res.status(402).json({
    error: 'Payment Required',
    x402: {
      provider: merchantAddress,
      ratePerSecond,
      minimumDeposit: String(Math.floor(parseFloat(ratePerSecond) * 3600 * 1_000_000_000)),
      packageId: PACKAGE_ID,
      instructions: 'Call create_stream() with this provider as recipient'
    }
  });
}
