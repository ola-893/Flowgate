import { useState, useEffect } from 'react';

type WebsiteListing = {
  id: string;
  domain: string;
  description: string;
  pricePerSecond: number;
  merchantBalance: number;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'provider' | 'agent'>('agent');
  
  // Mock on-chain registry state
  const [registeredSites, setRegisteredSites] = useState<WebsiteListing[]>([
    {
      id: '0xabc123...def',
      domain: 'http://localhost:3005/api/premium/alpha-signals/v1/btc',
      description: 'Proprietary high-frequency trading signals for BTC.',
      pricePerSecond: 0.05,
      merchantBalance: 0,
    },
    {
      id: '0x999bbb...ccc',
      domain: 'http://localhost:3005/api/premium/medical/data',
      description: 'Gated clinical trial results and raw patient datasets.',
      pricePerSecond: 0.12,
      merchantBalance: 0,
    }
  ]);

  // Provider Form State
  const [newDomain, setNewDomain] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Agent State
  const [agentUsdcBalance, setAgentUsdcBalance] = useState<number>(0);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<string>('Idle');
  const [dataContent, setDataContent] = useState<string>('');
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);

  // Simulated effect for the agent scraping an active stream
  useEffect(() => {
    let interval: any;
    if (activeStreamId && activeSiteId) {
      interval = setInterval(() => {
        // Drip merchant balance
        setRegisteredSites(prev => prev.map(site => {
          if (site.id === activeSiteId) {
            return { ...site, merchantBalance: site.merchantBalance + site.pricePerSecond };
          }
          return site;
        }));
        
        // Deduct from agent
        setAgentUsdcBalance((prev) => {
          const site = registeredSites.find(s => s.id === activeSiteId);
          return Math.max(0, prev - (site?.pricePerSecond || 0));
        });
        
        // Feed decrypted data
        setDataContent((prev) => prev + `\n[DECRYPTED] Stream tick from ${registeredSites.find(s=>s.id===activeSiteId)?.domain}...`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeStreamId, activeSiteId, registeredSites]);

  const handleRegisterWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    const newSite: WebsiteListing = {
      id: '0x' + Math.random().toString(16).substring(2, 10) + '...new',
      domain: newDomain,
      description: newDesc,
      pricePerSecond: parseFloat(newPrice),
      merchantBalance: 0,
    };
    setRegisteredSites([...registeredSites, newSite]);
    setNewDomain('');
    setNewDesc('');
    setNewPrice('');
    alert(`Successfully registered ${newDomain} to the SuiDataGate Marketplace!`);
  };

  const handleStartAgent = async (siteId: string) => {
    if (agentUsdcBalance === 0) {
      alert('Insufficient Funds. Please get testnet USDC.');
      return;
    }
    setActiveSiteId(siteId);
    setAgentStatus('Negotiating x402 via PTB...');
    // Simulate SDK PTB delay
    setTimeout(() => {
      setActiveStreamId('stream_' + Math.random().toString(16).substring(2, 8));
      setAgentStatus('Streaming & Decrypting via Seal');
    }, 2000);
  };

  const handleStopAgent = () => {
    setActiveStreamId(null);
    setActiveSiteId(null);
    setAgentStatus('Idle');
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '40px', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', background: 'linear-gradient(90deg, #3B82F6, #10B981)', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '42px', marginBottom: '10px' }}>
        Synapse Marketplace
      </h1>
      <p style={{ textAlign: 'center', color: '#a3a3a3', marginBottom: '40px' }}>The Autonomous On-Chain Knowledge Economy</p>
      
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
          Agent Discovery
        </button>
      </div>

      {activeTab === 'provider' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Registration Form */}
          <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '30px' }}>
            <h2>Register Premium Endpoint</h2>
            <p style={{ color: '#a3a3a3', marginBottom: '20px' }}>Deploy a `Listing` object to the Sui Network to monetize your API.</p>
            <form onSubmit={handleRegisterWebsite} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                placeholder="Domain (e.g. api.mydata.com)" 
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
                step="0.001"
                placeholder="Price per second (USDC)" 
                value={newPrice} 
                onChange={e => setNewPrice(e.target.value)}
                required
                style={{ padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
              />
              <button type="submit" style={{ padding: '14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Publish to Network
              </button>
            </form>
          </div>

          {/* Provider Dashboard */}
          <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '30px' }}>
            <h2>Your Active Listings & Earnings</h2>
            {registeredSites.map(site => (
              <div key={site.id} style={{ background: '#000', padding: '20px', borderRadius: '8px', marginTop: '15px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#3B82F6' }}>{site.domain}</h3>
                    <div style={{ fontSize: '12px', color: '#a3a3a3' }}>Object ID: {site.id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#a3a3a3' }}>Live Earnings</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{site.merchantBalance.toFixed(3)} USDC</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'agent' && (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Agent Discovery Hub</h2>
            <div style={{ background: '#171717', padding: '10px 20px', borderRadius: '8px', border: '1px solid #333' }}>
              <strong>Wallet: </strong>
              <span style={{ color: agentUsdcBalance > 0 ? '#10B981' : '#EF4444' }}>{agentUsdcBalance.toFixed(2)} USDC</span>
            </div>
          </div>

          {agentUsdcBalance === 0 && (
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6', borderRadius: '8px' }}>
              <strong>Circle Testnet USDC Required</strong>
              <p style={{ margin: '8px 0', fontSize: '14px', color: '#a3a3a3' }}>The agent requires testnet USDC to open payment streams for access.</p>
              <a href="https://faucet.circle.com/" target="_blank" rel="noreferrer" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 'bold' }}>
                → Get 20 USDC from Circle Faucet
              </a>
              <button 
                onClick={() => setAgentUsdcBalance(20)} 
                style={{ marginLeft: '15px', padding: '6px 12px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                Simulate Faucet Claim
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Directory List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {registeredSites.map(site => (
                <div key={site.id} style={{ background: '#171717', border: activeSiteId === site.id ? '2px solid #10B981' : '1px solid #262626', borderRadius: '16px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{site.domain}</h3>
                  <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '15px' }}>{site.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#3B82F6' }}>{site.pricePerSecond} USDC / sec</div>
                    <button 
                      onClick={() => activeStreamId && activeSiteId === site.id ? handleStopAgent() : handleStartAgent(site.id)}
                      disabled={!!activeStreamId && activeSiteId !== site.id}
                      style={{ 
                        padding: '8px 16px', 
                        background: activeStreamId && activeSiteId === site.id ? '#EF4444' : (!!activeStreamId ? '#333' : '#10B981'), 
                        color: '#fff', border: 'none', borderRadius: '8px', cursor: !!activeStreamId && activeSiteId !== site.id ? 'not-allowed' : 'pointer', fontWeight: 'bold' 
                      }}>
                      {activeStreamId && activeSiteId === site.id ? 'Close Stream' : 'Connect & Scrape'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Terminal */}
            <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Agent Execution Terminal</h3>
              <div style={{ marginBottom: '15px', padding: '10px', background: '#000', borderRadius: '8px', border: '1px solid #333' }}>
                <strong>Status:</strong> <span style={{ color: activeStreamId ? '#10B981' : '#a3a3a3' }}>{agentStatus}</span>
              </div>
              <div style={{ flexGrow: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '15px', overflowY: 'auto', minHeight: '300px' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#a3a3a3', fontSize: '14px' }}>
                  {dataContent || '> Waiting for agent instruction...'}
                </pre>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
