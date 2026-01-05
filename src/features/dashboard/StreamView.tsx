import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, ChevronDown } from 'lucide-react';
import { AgentConfig, Trace } from '../../types';
import { TraceRow } from './TraceRow';

interface StreamViewProps {
  agent: AgentConfig;
  traces: Trace[];
  onBack: () => void;
}

export const StreamView: React.FC<StreamViewProps> = ({ agent, traces, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  // Filter traces (simple logic)
  const filteredTraces = traces.filter(t => 
    t.trace_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">
      {/* Breadcrumb / Back Navigation */}
      <div className="mb-6 flex items-center gap-2">
         <button 
           onClick={onBack}
           className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
         >
            <ArrowLeft size={16} />
            Back to Dashboard
         </button>
         <span className="text-slate-300">/</span>
         <span className="text-sm font-semibold text-slate-700">{agent?.name}</span>
      </div>
      
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
             <h1 className="text-2xl font-semibold text-slate-900">{agent?.name}</h1>
             <p className="text-sm text-slate-500 mt-1">Real-time trace observation and debugging.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search traces..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium text-slate-700">
            <Filter size={14} />
            <span>Time Range: Last 1 Hour</span>
          </button>
        </div>
      </div>

      {/* Agent Configuration / Details */}
      {agent && (
        <div className="mb-8 bg-slate-50/50 rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="font-semibold text-sm text-slate-700">Agent Configuration</div>
                 <div className="text-xs text-slate-400 font-mono">ID: {agent.id}</div>
               </div>
               <button className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-1">
                 Edit Configuration
               </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Description</div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4">{agent.description}</p>
                  
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Model</div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {agent.model || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Tools</div>
                      <div className="flex flex-wrap gap-1">
                         {agent.capabilities.map((t, i) => (
                           <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 font-medium">
                             {t}
                           </span>
                         ))}
                      </div>
                    </div>
                  </div>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">System Prompt</div>
                    <button 
                      onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                      className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {isPromptExpanded ? (
                        <>
                          <ChevronDown size={12} className="rotate-180" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} />
                          Expand
                        </>
                      )}
                    </button>
                  </div>
                  {/* Note: In a real app the prompt might be in AgentConfig, but it wasn't in my type def yet, assuming it's missing or I should add it.
                      Checking useAgentPipeline, I didn't add systemPrompt to AGENT_CONFIGS but it was in App.jsx.
                      I'll create a placeholder or add it if possible. 
                      Actually, let's just make it static or assume it comes from config if I add it. 
                      For now I'll use a placeholder if missing. */}
                  <div className={`bg-slate-900 rounded p-3 text-xs font-mono text-slate-300 leading-relaxed overflow-y-auto custom-scrollbar whitespace-pre-wrap transition-all duration-300 ease-in-out ${isPromptExpanded ? 'h-[500px]' : 'h-[120px]'}`}>
                    {agent.systemPrompt || "No system prompt available."}
                  </div>
               </div>
            </div>
        </div>
      )}

      {/* DATA TABLE HEADER */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-t-lg border-t border-l border-r">
         <div className="col-span-3">Timestamp / Trace ID</div>
         <div className="col-span-6">Status / Duration / Error Preview</div>
         <div className="col-span-3 text-right">Actions</div>
      </div>

      {/* ROWS */}
      <div className="bg-white min-h-[500px] border-l border-r border-b border-slate-200 rounded-b-lg">
        {filteredTraces.map((trace) => (
          <TraceRow 
            key={trace.trace_id} 
            trace={trace} 
            expanded={expandedId === trace.trace_id}
            onClick={() => setExpandedId(expandedId === trace.trace_id ? null : trace.trace_id)}
          />
        ))}
      </div>
    </div>
  );
};
