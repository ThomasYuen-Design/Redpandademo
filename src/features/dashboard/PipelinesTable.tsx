import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/Badge';
import { AgentConfig } from '../../types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

interface PipelinesTableProps {
  agents: AgentConfig[];
  onSelectAgent: (agentId: string) => void;
}

export const PipelinesTable: React.FC<PipelinesTableProps> = ({ agents, onSelectAgent }) => {
  const columns = [
    {
      header: 'Name / ID',
      cell: (agent: AgentConfig) => (
        <div className="group">
          <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
            {agent.name}
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-blue-500" />
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5 truncate" title={agent.id}>
            {agent.id.substring(0, 12)}...
          </div>
        </div>
      ),
    },

    {
      header: 'Tools',
      className: 'hidden lg:table-cell',
      cell: (agent: AgentConfig) => (
        <div className="flex flex-wrap gap-1.5">
          {agent.capabilities.slice(0, 3).map((tool, idx) => (
             <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
               {tool}
             </span>
          ))}
          {agent.capabilities.length > 3 && (
             <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400">
               +{agent.capabilities.length - 3} more
             </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      cell: (agent: AgentConfig) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2">
                <StatusBadge status={agent.health.status} />
                {agent.health.status === 'DEGRADED' && agent.metrics.p99_latency > 2000 && (
                   <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{agent.health.status}</p>
              {agent.health.reason && <p className="text-xs text-slate-500">{agent.health.reason}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },

    {
      header: 'Model',
      className: 'hidden lg:table-cell',
      // Assuming 'model' is not in AgentConfig strict type from my previous 'index.ts' but it was in App.jsx. 
      // I should update AgentConfig in index.ts if I missed it!
      // Checking index.ts content... I don't see 'model' in AgentConfig. 
      // Wait, App.jsx had `model` in `agentsList`.
      // I need to add `model` to AgentConfig in index.ts. 
      // For now I'll cast or access it if I update type.
      // I will update AgentConfig type in a follow up or assume it's there. 
      // Actually I should update index.ts FIRST if I want strict type safety.
      // But for this step I'll assume it's there and I will fix index.ts shortly.
      cell: (agent: any) => (
         <div className="text-xs text-slate-600 flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
           {agent.model || 'N/A'}
         </div>
      )
    },
    {
      header: 'Metrics (p99 / Err)',
      className: 'text-right',
      cell: (agent: AgentConfig) => (
        <div className="flex items-center justify-end gap-3 text-right">
           <span className={`font-mono text-xs ${agent.metrics.p99_latency > 1000 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
             {agent.metrics.p99_latency}ms
           </span>
           <span className={`text-xs font-medium px-1.5 rounded ${
             agent.metrics.error_count > 0 ? 'bg-red-50 text-red-600' : 'text-slate-300'
           }`}>
             {agent.metrics.error_count} err
           </span>
        </div>
      )
    }
  ];

  return (
    <DataTable 
      data={agents}
      columns={columns}
      onRowClick={(agent) => onSelectAgent(agent.id)}
      className="shadow-sm bg-white"
    />
  );
};
