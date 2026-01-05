import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { PipelinesTable } from './PipelinesTable';
import { Filter, Search, Zap } from 'lucide-react';

export const AgentDashboard = ({ agents, onNavigate }) => {
  const stats = {
    total: agents.length,
    healthy: agents.filter(a => a.status === 'HEALTHY').length,
    degraded: agents.filter(a => a.status === 'DEGRADED').length,
    failed: agents.filter(a => a.status === 'FAILED').length,
    p99: Math.max(...agents.map(a => a.metrics.p99_latency), 0),
    throughput: agents.reduce((acc, a) => acc + (a.metrics.throughput || 0), 0)
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-semibold text-slate-900">Agent Pipelines</h1>
           <p className="text-sm text-slate-500 mt-1">Monitor the operational health, latency, and throughput of your AI Agents.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#E2401B] hover:bg-[#c93616] text-white rounded text-sm font-medium transition-colors shadow-sm">
            <span>+ New Pipeline</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <DashboardHeader stats={stats} />

      {/* Filters & Controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Search pipelines..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="flex-1" />
      </div>

      {/* Main Table */}
      <PipelinesTable agents={agents} onSelectAgent={(agentId) => onNavigate('stream', agentId)} />
    </div>
  );
};
