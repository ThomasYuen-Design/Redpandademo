import React from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const StatusDot = ({ status }) => {
  const colors = {
    HEALTHY: 'bg-emerald-500',
    DEGRADED: 'bg-amber-500',
    FAILED: 'bg-red-500',
  };
  
  return (
    <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-slate-300'}`} />
  );
};

export const PipelinesTable = ({ agents, onSelectAgent }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="col-span-3">Name / ID</div>
        <div className="col-span-4">Tools</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2">Model</div>
        <div className="col-span-2 text-right">Metrics (p99 / Err)</div>
      </div>

      <div className="divide-y divide-slate-100">
        {agents.map((agent) => (
          <div 
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 cursor-pointer transition-colors group"
          >
            {/* Name/ID */}
            <div className="col-span-3">
              <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                {agent.name}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-blue-500" />
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5 truncate" title={agent.id}>
                {agent.id.substring(0, 12)}...
              </div>
            </div>

            {/* Tools */}
            <div className="col-span-4 flex flex-wrap gap-1.5">
              {agent.tools.slice(0, 3).map((tool, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {tool}
                </span>
              ))}
              {agent.tools.length > 3 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400">
                  +{agent.tools.length - 3} more
                </span>
              )}
            </div>

            {/* Status */}
            <div className="col-span-1 flex items-center gap-2">
              <StatusDot status={agent.status} />
              <span className={`text-xs font-medium ${
                agent.status === 'DEGRADED' ? 'text-amber-600' :
                agent.status === 'FAILED' ? 'text-red-600' : 'text-slate-600'
              }`}>
                {agent.status}
              </span>
            </div>

            {/* Model */}
            <div className="col-span-2">
               <div className="text-xs text-slate-600 flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                 {agent.model}
               </div>
            </div>

            {/* Metrics */}
            <div className="col-span-2 text-right">
               <div className="flex items-center justify-end gap-3">
                 <span className={`font-mono text-xs ${agent.metrics.p99_latency > 1000 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                   {agent.metrics.p99_latency}ms
                 </span>
                 <span className={`text-xs font-medium px-1.5 rounded ${
                   agent.metrics.errors_24h > 0 ? 'bg-red-50 text-red-600' : 'text-slate-300'
                 }`}>
                   {agent.metrics.errors_24h} err
                 </span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
