## The Problem
Sam Altman vs Elon Musk. OpenAI scraping X. The broader war between AI companies and websites whose data they consume: no compensation, no consent, aggressive blocking on both sides. There is no programmatic way for a website to say "you can scrape me, but you pay per second."

## What StreamEngine Does
A marketplace where website owners list their sites with a price per second of scraping access. AI agents discover listed sites, hit a 402 Payment Required response, automatically open a SUI payment stream via the StreamEngine SDK, and gain access. The moment the stream stops, access is revoked instantly. No invoices, no monthly billing, no trust required on either side.

## Architecture (ASCII diagram)
```text
Website owner
    |
    | registers site + price per second
    v
StreamEngine marketplace
    |
    | agent discovers listed website
    v
Premium scrape route
    |
    | HTTP 402 Payment Required
    v
StreamEngine SDK
    |
    | PTB creates StreamObject on Sui
    v
Sui Testnet
    |
    | StreamObject balance > 0
    v
Gateway middleware verifies balance by RPC
    |
    | access granted
    v
Scraped website data flows to agent
    |
    | stream closes or balance reaches 0
    v
Gateway returns 402 again
```

## Why Sui
- Object-based StreamObject: access tied directly to an on-chain asset
- PTBs: agent bundles payment negotiation into a single atomic transaction
- Sub-second finality: access granted or revoked in real time

## Deployed Contract
Package: 0xb05b3964df8b88a86cda6b192893399966014af9dd6fc6beb26f1343a0495495

Network: Sui Testnet

## How to Run the Demo
```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
cd sdk && npm install && npx tsx src/test-e2e.ts
```

## Demo Video Script
- Open the dashboard and show X, Reddit, and Bloomberg listed with per-second scraping prices.
- Switch to Agent Terminal and click "Connect & Scrape" on X.
- Show the 402 negotiation, real Sui stream creation transaction hash, and scraped post data.
- Show the active StreamObject balance decreasing via RPC reads.
- Close the stream and show the refund transaction hash.
- Request access again and show the gateway returning 402 after revocation.
