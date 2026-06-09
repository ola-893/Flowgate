import { useState } from 'react';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import MemoryExplorer from './pages/MemoryExplorer';

const queryClient = new QueryClient();
const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider>
          <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Synapse Operator Console</h1>
            <nav style={{ marginBottom: '20px' }}>
              <button 
                onClick={() => setActiveTab('dashboard')}
                style={{ fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', marginRight: '10px' }}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('memory')}
                style={{ fontWeight: activeTab === 'memory' ? 'bold' : 'normal' }}
              >
                Memory Explorer
              </button>
            </nav>
            
            {activeTab === 'dashboard' ? <Dashboard /> : <MemoryExplorer />}
          </div>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
