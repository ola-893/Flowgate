import { Request, Response, NextFunction } from 'express';
import { SuiClient } from '@mysten/sui/client';

const SUI_RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const client = new SuiClient({ url: SUI_RPC_URL });

export async function requireX402Payment(req: Request, res: Response, next: NextFunction) {
  const streamId = req.headers['x-flowpay-stream-id'] as string;
  const txDigest = req.headers['x-flowpay-tx-digest'] as string;

  if (streamId) {
      // Validate the stream object via RPC (no consensus contention)
      try {
          const objectData = await client.getObject({
              id: streamId,
              options: { showContent: true }
          });

          if (objectData.data && objectData.data.content?.dataType === 'moveObject') {
              const fields = objectData.data.content.fields as any;
              const balance = BigInt(fields.balance);
              if (balance > 0n) {
                  console.log(`[Middleware] Valid stream ${streamId} found with balance: ${balance}`);
                  // Signal downstream handlers that data should be seal-encrypted
                  (req as any).sealEncryptionPolicy = {
                      streamId,
                      agentId: fields.sender
                  };
                  return next();
              } else {
                  console.log(`[Middleware] Stream ${streamId} is empty.`);
              }
          }
      } catch (e) {
          console.error(`[Middleware] Error querying stream ${streamId}:`, e);
      }
  } else if (txDigest) {
      // Fast-Path verification
      try {
          const tx = await client.getTransactionBlock({
              digest: txDigest,
              options: { showEffects: true, showInput: true }
          });
          if (tx.effects?.status.status === 'success') {
              console.log(`[Middleware] Valid Fast-Path payment found: ${txDigest}`);
              return next();
          }
      } catch (e) {
          console.error(`[Middleware] Error verifying tx ${txDigest}:`, e);
      }
  }

  res.set('X-FlowPay-Mode', 'streaming');
  res.set('X-FlowPay-Rate', '0.005');
  res.set('X-FlowPay-Recipient', process.env.MERCHANT_SUI_ADDRESS || '0x_merchant');

  // If no valid payment found, trigger 402
  res.status(402).json({
    error: 'Payment Required',
    requirements: {
      amount: '0.005', // In SUI
      recipient: process.env.MERCHANT_SUI_ADDRESS || '0x_merchant',
      supportedStrategies: ['direct', 'stream']
    }
  });
}
