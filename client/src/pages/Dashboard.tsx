import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SuiDataGateSDK } from '../lib/SuiDataGateSDK';

const GATEWAY_URL = 'http://localhost:3001';
const RPC_URL = 'https://fullnode.testnet.sui.io:443';
const AGENT_KEY = "suiprivkey1qp5z0u5x72yvjmwulrltg2nzwk6xddk2cqxcy736ydytrmnyns4rsugn8zz"; // Testnet key

type ProviderListing = {
  id: string;
  providerAddress: string;
  name: string;
  endpoint: string;
  ratePerSecond: string;
  description: string;
  category: string;
  registeredAt: string;
};

type StreamBalanceResponse = {
  streamId: string;
  balanceMist: number;
  balanceSui: number;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'provider' | 'agent'>('agent');
  
  // Registry State
  const [registeredSites, setRegisteredSites] = useState<ProviderListing[]>([]);
  const [providerEarningsMist, setProviderEarningsMist] = useState<Record<string, number>>({});
  
  // Provider Form State
  const [newDomain, setNewDomain] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  // Agent SDK State
  const sdkRef = useRef<SuiDataGateSDK | null>(null);
  const [agentAddress, setAgentAddress] = useState<string>('');
  const [agentUsdcBalance, setAgentUsdcBalance] = useState<number>(0);
  const [agentStatus, setAgentStatus] = useState<string>('Idle');
  const [dataContent, setDataContent] = useState<string>('');
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [streamBalanceMist, setStreamBalanceMist] = useState<number>(0);

  // 1. Initialize SDK
  useEffect(() => {
    import('@mysten/sui/cryptography').then(({ decodeSuiPrivateKey }) => {
        const { secretKey } = decodeSuiPrivateKey(AGENT_KEY);
        // Using Uint8Array in the SDK, so we pass hex
        const hex = Array.from(secretKey).map(b => b.toString(16).padStart(2, '0')).join('');
        
        const sdk = new SuiDataGateSDK({
            privateKeyHex: hex,
            rpcUrl: RPC_URL,
            agentId: 'frontend-demo-agent',
            coinType: '0x2::sui::SUI' // Using SUI for demo
        });
        
        // Force stream mode
        sdk.brain.shouldStream = async () => ({ mode: 'stream', reasoning: 'forced by frontend demo' });
        
        sdkRef.current = sdk;
        setAgentAddress(sdk.getAddress());
        
        // Fetch balance
        sdk.getBalance().then(bal => setAgentUsdcBalance(Number(bal) / 1e9));
    });
  }, []);

  // 2. Fetch Providers
  const fetchProviders = async () => {
    try {
      const res = await axios.get<{ providers: ProviderListing[] }>(`${GATEWAY_URL}/api/providers`);
      const providers = res.data.providers;
      setRegisteredSites(providers);

      const earnings = await Promise.all(
        providers.map(async site => {
          try {
            const earningsRes = await axios.get<{ totalEarnedMist: number }>(`${GATEWAY_URL}/api/providers/${site.id}/earnings`);
            return [site.id, earningsRes.data.totalEarnedMist] as const;
          } catch {
            return [site.id, 0] as const;
          }
        })
      );
      setProviderEarningsMist(Object.fromEntries(earnings));
    } catch (e) {
      console.error("Failed to load providers. Is the server running?");
    }
  };

  useEffect(() => {
    fetchProviders();
    const interval = setInterval(fetchProviders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // 3. Track active stream balance on-chain
  useEffect(() => {
    if (!activeStreamId || !sdkRef.current) return;

    let cancelled = false;
    const pollBalance = async () => {
      try {
        const [streamRes, mainBal] = await Promise.all([
          axios.get<StreamBalanceResponse>(`${GATEWAY_URL}/api/streams/${activeStreamId}/balance`),
          sdkRef.current!.getBalance(),
        ]);
        if (cancelled) return;
        setStreamBalanceMist(streamRes.data.balanceMist);
        setAgentUsdcBalance(Number(mainBal) / 1e9);
      } catch (e) {
        if (!cancelled) setStreamBalanceMist(0);
      }
    };

    pollBalance();
    const interval = setInterval(pollBalance, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeStreamId]);

  const handleRegisterWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${GATEWAY_URL}/api/providers`, {
        providerAddress: '0x0000000000000000000000000000000000000000000000000000000000001234',
        name: newDomain,
        endpoint: `/api/premium/${newCategory.toLowerCase()}/${Math.random().toString(36).substring(7)}`,
        ratePerSecond: newPrice,
        description: newDesc,
        category: newCategory
      });
      fetchProviders();
      setNewDomain('');
      setNewDesc('');
      setNewPrice('');
      alert(`Successfully registered ${newDomain}!`);
    } catch (err) {
      alert("Registration failed");
    }
  };

  const handleStartAgent = async (site: ProviderListing) => {
    if (!sdkRef.current) return;
    
    if (agentUsdcBalance === 0) {
      alert('Insufficient Funds. Please fund your SUI wallet.');
      return;
    }

    setActiveSiteId(site.id);
    setAgentStatus('Connecting & Negotiating Payment via PTB...');
    setDataContent(prev => prev + `\\n\\n[SYSTEM] Attempting access to ${site.name}...`);
    
    try {
        const fullUrl = `${GATEWAY_URL}${site.endpoint}`;
        // The SDK handles the 402 and creates the stream automatically!
        const response = await sdkRef.current.makeRequest(fullUrl);
        
        // Find the active stream for this host
        const urlObj = new URL(fullUrl);
        const streamMeta = sdkRef.current.getActiveStreams().get(urlObj.host);
        
        if (streamMeta) {
            setActiveStreamId(streamMeta.streamId);
            setAgentStatus(response.isDecrypted ? 'Active Stream — Data Decrypted via Seal' : 'Active Stream — Data Served by On-Chain Gate');
        } else {
            setAgentStatus('Request Success (No Stream Created?)');
        }

        setDataContent(prev => prev + `\\n\\n[STREAM DATA from ${site.name}]\\n` + JSON.stringify(response.data.data ?? response.data, null, 2));

    } catch (err: any) {
        setAgentStatus('Error: Access Denied');
        setDataContent(prev => prev + `\\n\\n[ERROR] ${err.message}`);
        setActiveSiteId(null);
    }
  };

  const handleStopAgent = async () => {
    if (!sdkRef.current || !activeStreamId) return;
    
    setAgentStatus('Closing stream and reclaiming funds...');
    try {
        const result = await sdkRef.current.closeStream(activeStreamId);
        setAgentStatus(`Idle — Stream Closed. Refunded ${result.refundedAmount} MIST`);
        setDataContent(prev => prev + `\\n\\n[SYSTEM] Stream closed on-chain. Refunded unspent balance. TX: ${result.digest}`);
    } catch (err: any) {
        setAgentStatus(`Error closing stream: ${err.message}`);
    }
    
    setActiveStreamId(null);
    setActiveSiteId(null);
    setStreamBalanceMist(0);
    
    // Refresh balance
    const bal = await sdkRef.current.getBalance();
    setAgentUsdcBalance(Number(bal) / 1e9);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '40px', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', background: 'linear-gradient(90deg, #3B82F6, #10B981)', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '42px', marginBottom: '10px' }}>
        StreamEngine Dashboard
      </h1>
      <p style={{ textAlign: 'center', color: '#a3a3a3', marginBottom: '40px' }}>The Programmable AI Knowledge Economy on Sui</p>
      
      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
        <button 
          onClick={() => setActiveTab('provider')}
          style={{ padding: '12px 24px', background: activeTab === 'provider' ? '#3B82F6' : '#171717', color: '#fff', border: '1px solid #262626', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Provider Hub
        </button>
        <button 
          onClick={() => setActiveTab('agent')}
          style={{ padding: '12px 24px', background: activeTab === 'agent' ? '#10B981' : '#171717', color: '#fff', border: '1px solid #262626', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Agent Terminal
        </button>
      </div>

      {activeTab === 'provider' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '30px' }}>
            <h2>Register Premium API</h2>
            <p style={{ color: '#a3a3a3', marginBottom: '20px' }}>Publish your API to the StreamEngine Marketplace registry.</p>
            <form onSubmit={handleRegisterWebsite} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                placeholder="Provider Name (e.g. Alpha Signals)" 
                value={newDomain} 
                onChange={e => setNewDomain(e.target.value)}
                required
                style={{ padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
              />
              <input 
                type="text" 
                placeholder="Description of proprietary data" 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)}
                required
                style={{ padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
              />
              <input 
                type="number" 
                step="0.00001"
                placeholder="Price per second (SUI)" 
                value={newPrice} 
                onChange={e => setNewPrice(e.target.value)}
                required
                style={{ padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
              />
              <select 
                value={newCategory} 
                onChange={e => setNewCategory(e.target.value)}
                style={{ padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
              >
                 <option>Finance</option>
                 <option>Medical</option>
                 <option>Legal</option>
                 <option>General</option>
              </select>
              <button type="submit" style={{ padding: '14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Publish to Registry
              </button>
            </form>
          </div>

          <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '30px' }}>
            <h2>Marketplace Registry Directory</h2>
            {registeredSites.map(site => (
              <div key={site.id} style={{ background: '#000', padding: '20px', borderRadius: '8px', marginTop: '15px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#3B82F6' }}>{site.name}</h3>
                    <div style={{ fontSize: '12px', color: '#a3a3a3', marginBottom: '5px' }}>{site.endpoint}</div>
                    <div style={{ fontSize: '12px', color: '#10B981', display: 'inline-block', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>{site.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#a3a3a3' }}>Streaming Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{site.ratePerSecond} SUI/s</div>
                    <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '8px' }}>Live Earnings</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10B981' }}>{((providerEarningsMist[site.id] || 0) / 1e9).toFixed(6)} SUI</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'agent' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Agent Execution Terminal</h2>
            <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ background: '#171717', padding: '10px 20px', borderRadius: '8px', border: '1px solid #333', fontSize: '14px' }}>
                <strong>Address: </strong>
                <span style={{ color: '#a3a3a3' }}>{agentAddress.substring(0, 10)}...{agentAddress.substring(agentAddress.length - 6)}</span>
                </div>
                <div style={{ background: '#171717', padding: '10px 20px', borderRadius: '8px', border: '1px solid #333', fontSize: '14px' }}>
                <strong>Wallet: </strong>
                <span style={{ color: agentUsdcBalance > 0 ? '#10B981' : '#EF4444' }}>{agentUsdcBalance.toFixed(4)} SUI</span>
                </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Directory List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ margin: 0, paddingBottom: '10px', borderBottom: '1px solid #333' }}>Available Providers</h3>
              {registeredSites.map(site => (
                <div key={site.id} style={{ background: '#171717', border: activeSiteId === site.id ? '2px solid #10B981' : '1px solid #262626', borderRadius: '16px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{site.name}</h3>
                  <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '15px' }}>{site.description}</p>
                  
                  {activeSiteId === site.id && activeStreamId && (
                     <div style={{ marginBottom: '15px', padding: '10px', background: '#000', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ fontSize: '12px', color: '#a3a3a3' }}>On-Chain Stream Balance:</div>
                        <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '18px' }}>{(streamBalanceMist / 1e9).toFixed(4)} SUI remaining</div>
                     </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#3B82F6' }}>{site.ratePerSecond} SUI / sec</div>
                    <button 
                      onClick={() => activeStreamId && activeSiteId === site.id ? handleStopAgent() : handleStartAgent(site)}
                      disabled={!!activeStreamId && activeSiteId !== site.id}
                      style={{ 
                        padding: '8px 16px', 
                        background: activeStreamId && activeSiteId === site.id ? '#EF4444' : (!!activeStreamId ? '#333' : '#10B981'), 
                        color: '#fff', border: 'none', borderRadius: '8px', cursor: !!activeStreamId && activeSiteId !== site.id ? 'not-allowed' : 'pointer', fontWeight: 'bold' 
                      }}>
                      {activeStreamId && activeSiteId === site.id ? 'Close Stream & Refund' : 'Connect & Scrape'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Terminal */}
            <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Terminal Output</h3>
                {activeStreamId && <div style={{ fontSize: '12px', color: '#10B981' }}>Stream ID: {activeStreamId.substring(0, 15)}...</div>}
              </div>
              <div style={{ marginBottom: '15px', padding: '10px', background: '#000', borderRadius: '8px', border: '1px solid #333' }}>
                <strong>Status:</strong> <span style={{ color: activeStreamId ? '#10B981' : '#a3a3a3' }}>{agentStatus}</span>
              </div>
              <div style={{ flexGrow: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '15px', overflowY: 'auto', minHeight: '500px' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#a3a3a3', fontSize: '14px' }}>
                  {dataContent || '> Waiting for agent instruction...\\n> Select a provider to begin.'}
                </pre>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
