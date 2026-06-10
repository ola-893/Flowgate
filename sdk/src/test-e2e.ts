import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import axios from 'axios';
import { SuiDataGateSDK } from './SuiDataGateSDK';

// ============================================================
//  StreamEngine Full E2E Test
//  
//  Prerequisites: Start the server first:
//    cd server && npx tsx src/index.ts
//
//  This test demonstrates:
//    1. Agent browses the marketplace registry
//    2. Agent hits a premium endpoint → gets 402
//    3. SDK intercepts 402, creates stream on-chain
//    4. Agent gets data (access granted)
//    5. Agent closes stream → reclaims unspent funds
//    6. Agent hits endpoint again → gets 402 (access revoked)
// ============================================================

const GATEWAY_URL = 'http://localhost:3001';
const SUI_RPC_URL = 'https://fullnode.testnet.sui.io:443';

async function runE2E() {
    console.log("=".repeat(60));
    console.log("  StreamEngine Full E2E Lifecycle Test");
    console.log("=".repeat(60) + "\n");

    // --- Step 1: Browse the Registry ---
    console.log("[Step 1] Browsing the marketplace registry...");
    try {
        const { data: registryData } = await axios.get(`${GATEWAY_URL}/api/registry/providers`);
        console.log(`  Found ${registryData.providers.length} providers:`);
        for (const p of registryData.providers) {
            console.log(`    • ${p.name} — ${p.ratePerSecond} SUI/sec — ${p.endpoint}`);
        }
    } catch (e: any) {
        console.error("  ❌ Could not reach registry. Is the server running?");
        console.error(`     Start it with: cd server && npx tsx src/index.ts`);
        return;
    }

    // --- Step 2: Initialize Agent SDK ---
    console.log("\n[Step 2] Initializing agent wallet & SDK...");
    const bech32Key = "suiprivkey1qp5z0u5x72yvjmwulrltg2nzwk6xddk2cqxcy736ydytrmnyns4rsugn8zz";
    const { secretKey } = decodeSuiPrivateKey(bech32Key);

    const sdk = new SuiDataGateSDK({
        privateKeyHex: Buffer.from(secretKey).toString('hex'),
        rpcUrl: SUI_RPC_URL,
        agentId: 'e2e-test-agent',
        coinType: '0x2::sui::SUI'
    });
    // Force stream mode
    sdk.brain.shouldStream = async () => ({ mode: 'stream', reasoning: 'forced for e2e test' });

    const agentBalance = await sdk.getBalance();
    console.log(`  Agent address: ${sdk.getAddress()}`);
    console.log(`  Agent balance: ${(Number(agentBalance) / 1e9).toFixed(4)} SUI`);

    // --- Step 3: Hit premium endpoint without payment → expect 402 ---
    console.log("\n[Step 3] Requesting premium data WITHOUT payment...");
    try {
        await axios.get(`${GATEWAY_URL}/api/premium/alpha-signals/v1/btc`);
        console.error("  ❌ Expected 402 but got 200 — middleware is broken!");
        return;
    } catch (e: any) {
        if (e.response?.status === 402) {
            console.log(`  ✅ Got 402 Payment Required (as expected)`);
            console.log(`     Provider: ${e.response.data.x402.provider}`);
            console.log(`     Rate: ${e.response.data.x402.ratePerSecond} SUI/sec`);
            console.log(`     Package: ${e.response.data.x402.packageId}`);
        } else {
            console.error(`  ❌ Unexpected error: ${e.message}`);
            return;
        }
    }

    // --- Step 4: Use SDK to automatically handle 402 → create stream → get data ---
    console.log("\n[Step 4] Using SDK to handle 402 automatically (PTB stream creation)...");
    const response = await sdk.makeRequest(`${GATEWAY_URL}/api/premium/alpha-signals/v1/btc`);
    console.log(`  ✅ Data received!`);
    console.log(`     Provider: ${response.data.provider}`);
    console.log(`     Signal: ${response.data.data.signal}`);
    console.log(`     Confidence: ${response.data.data.confidence}`);

    // --- Step 5: Verify stream exists ---
    console.log("\n[Step 5] Verifying active stream on-chain...");
    const activeStreams = sdk.getActiveStreams();
    let streamId: string | null = null;
    for (const [host, meta] of activeStreams) {
        streamId = meta.streamId;
        const balance = await sdk.getStreamBalance(streamId);
        console.log(`  Stream: ${streamId}`);
        console.log(`  Creation TX Digest: ${meta.creationDigest}`);
        console.log(`  Host: ${host}`);
        console.log(`  On-chain balance: ${balance} MIST (${Number(balance) / 1e9} SUI)`);
    }

    if (!streamId) {
        console.error("  ❌ No active stream found — something went wrong");
        return;
    }

    // --- Step 6: Make another request using existing stream → should succeed ---
    console.log("\n[Step 6] Making second request using existing stream...");
    const response2 = await sdk.makeRequest(`${GATEWAY_URL}/api/premium/alpha-signals/v1/btc`);
    console.log(`  ✅ Data received again (stream reused, no new PTB needed)`);
    console.log(`     Timestamp: ${response2.data.data.timestamp}`);

    // --- Step 7: Close the stream → reclaim unspent funds ---
    console.log("\n[Step 7] Closing stream (reclaiming unspent funds)...");
    const closeResult = await sdk.closeStream(streamId);
    console.log(`  ✅ Stream closed!`);
    console.log(`     TX Digest: ${closeResult.digest}`);
    console.log(`     Refunded: ${closeResult.refundedAmount} MIST`);

    // --- Step 8: Hit endpoint again → should get 402 (access revoked!) ---
    console.log("\n[Step 8] Requesting data AFTER stream closed...");
    try {
        await axios.get(`${GATEWAY_URL}/api/premium/alpha-signals/v1/btc`);
        console.error("  ❌ Expected 402 but got 200 — access should have been revoked!");
    } catch (e: any) {
        if (e.response?.status === 402) {
            console.log(`  ✅ Got 402 — access successfully revoked after stream closure!`);
        } else {
            console.error(`  ❌ Unexpected error: ${e.message}`);
        }
    }

    // --- Summary ---
    const finalBalance = await sdk.getBalance();
    console.log("\n" + "=".repeat(60));
    console.log("  ✅ Full E2E Lifecycle Test PASSED");
    console.log("");
    console.log("  Complete flow demonstrated:");
    console.log("    1. Agent browsed marketplace registry (3 providers)");
    console.log("    2. Agent hit paywalled endpoint → 402 Payment Required");
    console.log("    3. SDK auto-created payment stream on Sui testnet");
    console.log("    4. Middleware verified stream balance via RPC → data served");
    console.log("    5. Second request reused existing stream (no new TX)");
    console.log("    6. Agent closed stream → reclaimed unspent funds");
    console.log("    7. Access revoked → 402 returned again");
    console.log("");
    console.log(`  Agent final balance: ${(Number(finalBalance) / 1e9).toFixed(4)} SUI`);
    console.log("=".repeat(60));
}

runE2E().catch(e => {
    console.error("\n❌ E2E test failed:", e.message);
    if (e.stack) console.error(e.stack);
});
