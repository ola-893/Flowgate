import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [streamId, setStreamId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<string>('Idle');
  const [dataContent, setDataContent] = useState<string>('');
  const [merchantBalance, setMerchantBalance] = useState<number>(0);

  // Simulated effect for the agent scraping
  useEffect(() => {
    let interval: any;
    if (streamId) {
      interval = setInterval(() => {
        // drip merchant balance
        setMerchantBalance((prev) => prev + 0.005);
        setDataContent((prev) => prev + "\n[DECRYPTED] Stream data tick...");
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [streamId]);

  const handleStartAgent = async () => {
    setAgentStatus('Negotiating x402 via PTB...');
    // Simulate SDK PTB delay
    setTimeout(() => {
      setStreamId('0x123abc_stream_id');
      setAgentStatus('Streaming & Decrypting via Seal');
    }, 2000);
  };

  const handleStopAgent = () => {
    setStreamId(null);
    setAgentStatus('Idle');
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '40px', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', background: 'linear-gradient(90deg, #3B82F6, #10B981)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        SuiDataGate Marketplace
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }}>
        
        {/* Merchant View */}
        <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '30px' }}>
          <h2>Merchant Dashboard</h2>
          <p style={{ color: '#a3a3a3' }}>Proprietary AI Dataset (Encrypted via Sui Seal)</p>
          
          <div style={{ marginTop: '20px', padding: '20px', background: '#000', borderRadius: '8px' }}>
            <h3 style={{ margin: 0, color: '#10B981' }}>Live Earnings</h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '10px' }}>
              {merchantBalance.toFixed(3)} SUI
            </div>
            {streamId && <div style={{ color: '#3B82F6', marginTop: '10px', fontSize: '14px' }}>● Active Stream Drip...</div>}
          </div>

          <div style={{ marginTop: '20px' }}>
            <p>Access Policy: <code>seal_approve_stream</code></p>
            <p>Status: <span style={{ color: '#10B981' }}>Secured & Hosted</span></p>
          </div>
        </div>

        {/* Agent View */}
        <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '30px' }}>
          <h2>AI Agent Console</h2>
          <p style={{ color: '#a3a3a3' }}>Data Scraper & Decoder</p>
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button 
              onClick={handleStartAgent} 
              disabled={!!streamId}
              style={{ padding: '12px 24px', background: streamId ? '#333' : '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: streamId ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              Launch Scraper
            </button>
            <button 
              onClick={handleStopAgent} 
              disabled={!streamId}
              style={{ padding: '12px 24px', background: !streamId ? '#333' : '#EF4444', color: 'white', border: 'none', borderRadius: '8px', cursor: !streamId ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              Close Stream (Claim Rebate)
            </button>
          </div>

          <div style={{ marginTop: '25px', padding: '15px', background: '#000', borderRadius: '8px' }}>
            <strong>Status:</strong> <span style={{ color: streamId ? '#10B981' : '#a3a3a3' }}>{agentStatus}</span>
          </div>

          <div style={{ marginTop: '20px' }}>
            <strong>Decrypted Data Feed (Seal):</strong>
            <pre style={{ background: '#0a0a0a', border: '1px solid #333', padding: '15px', borderRadius: '8px', minHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {dataContent || 'No data requested...'}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
