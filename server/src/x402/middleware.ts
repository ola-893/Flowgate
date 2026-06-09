import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware that intercepts requests and enforces x402 Payment Required.
 */
export function requireX402Payment(req: Request, res: Response, next: NextFunction) {
  // Check if a valid payment proof is provided in headers
  const paymentProof = req.headers['x-payment-proof'];
  
  if (!paymentProof) {
    // Return HTTP 402 with payment requirements
    res.status(402).json({
      error: 'Payment Required',
      requirements: {
        amount: '0.005',
        token: 'SUI',
        recipient: '0x_synapse_treasury_address',
        supportedStrategies: ['direct', 'stream']
      }
    });
    return;
  }
  
  // In a real implementation, verify the payment proof here
  // If valid, proceed to the actual route handler
  next();
}
