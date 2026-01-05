import { useState } from 'react';
import { TopBar } from './components/layout/TopBar';
import { AgentDashboard } from './features/dashboard/AgentDashboard';
import { StreamView } from './features/dashboard/StreamView';
import { useAgentPipeline } from './hooks/useAgentPipeline';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'stream'>('dashboard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  const { agents, traces, stats } = useAgentPipeline();

  const handleNavigate = (view: string, agentId?: string) => {
    if (view === 'dashboard') {
      setCurrentView('dashboard');
      setSelectedAgentId(null);
    } else if (view === 'stream') {
      setCurrentView('stream');
      if (agentId) setSelectedAgentId(agentId);
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const agentTraces = selectedAgent 
    ? traces.filter(t => t.service === selectedAgent.id) 
    : [];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <TopBar />

      {/* VIEW: DASHBOARD (Home) */}
      {currentView === 'dashboard' && (
        <AgentDashboard agents={agents} stats={stats} onNavigate={handleNavigate} />
      )}

      {/* VIEW: STREAM (Drill-down) */}
      {currentView === 'stream' && selectedAgent && (
        <StreamView 
          agent={selectedAgent} 
          traces={agentTraces} 
          onBack={() => handleNavigate('dashboard')} 
        />
      )}
    </div>
  );
}
