import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [status, setStatus] = useState({ isRunning: false, lastTickTime: null });

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/agent/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to fetch agent status", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    await fetch('http://localhost:3001/api/agent/start', { method: 'POST' });
    fetchStatus();
  };

  const handleStop = async () => {
    await fetch('http://localhost:3001/api/agent/stop', { method: 'POST' });
    fetchStatus();
  };

  return (
    <div>
      <h2>Agent Status</h2>
      <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
        <p><strong>Status:</strong> {status.isRunning ? '🟢 Running' : '🔴 Stopped'}</p>
        <p><strong>Last Tick:</strong> {status.lastTickTime ? new Date(status.lastTickTime).toLocaleString() : 'Never'}</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleStart} disabled={status.isRunning} style={{ padding: '10px 20px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px' }}>
          Start Agent
        </button>
        <button onClick={handleStop} disabled={!status.isRunning} style={{ padding: '10px 20px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px' }}>
          Stop Agent
        </button>
      </div>
    </div>
  );
}
