import React from 'react';
import { ChevronRight, Clock, Database, ShieldAlert, BrainCircuit, Server, MoreHorizontal } from 'lucide-react';
import { Trace } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { JsonViewer } from '../../components/ui/JsonViewer';

interface TraceRowProps {
  trace: Trace;
  expanded: boolean;
  onClick: () => void;
}

export const TraceRow: React.FC<TraceRowProps> = ({ trace, expanded, onClick }) => {
  // Parsing the Waterfall Structure - Adapting to new "stage" based keys
  const triggerSpan = trace.spans.find(s => s.stage === 'INGEST' || s.type === 'trigger');
  const agentSpan = trace.spans.find(s => s.stage === 'AGENT_CORE' || s.type === 'llm_thought' || s.stage === 'GOVERNANCE_CHECK');
  const actionSpan = trace.spans.find(s => s.stage === 'SINK' || s.type === 'tool_execution' || s.type === 'system_event' || s.stage === 'ROUTING');

  const dateStr = new Date(trace.timestamp).toISOString().replace('T', ' ').replace('Z', '');
  const duration = trace.latency_ms || trace.total_duration_ms || 0;
  
  // Dynamic Styles based on status
  const rowBg = expanded ? 'bg-slate-50' : 'bg-white';
  const borderColor = expanded ? 'border-b border-slate-300' : 'border-b border-slate-100';

  return (
    <div className={`${borderColor} ${rowBg} transition-colors`}>
      {/* Row Summary */}
      <div 
        onClick={onClick}
        className="grid grid-cols-12 gap-4 px-6 py-3 items-center cursor-pointer group select-none"
      >
        {/* Time / ID */}
        <div className="col-span-3 flex items-center gap-3">
           <div className={`p-1 rounded-sm transition-transform duration-200 ${expanded ? 'bg-slate-200 rotate-90' : 'text-slate-400 group-hover:text-slate-600'}`}>
              <ChevronRight size={14} />
           </div>
           <div>
             <div className="font-mono text-xs text-slate-600 font-medium">{dateStr}</div>
             <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                ID: {trace.trace_id}
             </div>
           </div>
        </div>

        {/* Status / Latency */}
        <div className="col-span-6 flex items-center gap-4">
          <StatusBadge status={trace.status} />
          
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
             duration > 1000 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
             <Clock size={10} />
             {duration}ms
          </div>

          {/* Mini preview of the error reason if exists */}
          {(!trace.status.includes('200') && !trace.status.includes('SUCCESS') && !trace.status.includes('204')) && (
            <span className="text-[10px] text-red-500 font-medium truncate max-w-[200px]">
              {agentSpan?.reasoning_trace || actionSpan?.reason || "Check Logs"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-3 flex justify-end">
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal size={16} />
           </button>
        </div>
      </div>

      {/* EXPANDED "SWIMLANE" VIEW */}
      {expanded && (
        <div className="px-10 py-6 animate-in fade-in slide-in-from-top-1 duration-200 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col gap-8 relative max-w-4xl">
            
            {/* Vertical Connector Line (Visual Polish) */}
            <div className="absolute top-4 bottom-4 left-[21px] w-px bg-slate-200 border-l border-dashed border-slate-300 z-0" />

            {/* ROW 1: INGEST (Trigger Span) */}
            {triggerSpan && (
            <div className="relative z-10 pl-16">
               <div className="absolute left-0 top-0 p-1.5 bg-slate-50 border border-slate-200 rounded-full z-10">
                 <Database size={16} className="text-blue-500" />
               </div>
               
               <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                <span>{triggerSpan.stage || "Ingest"}</span>
               </div>
              
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm relative">
                <div className="text-xs font-semibold text-slate-700 mb-2">{triggerSpan.topic ? `Topic: ${triggerSpan.topic}` : "Event Ingest"}</div>
                
                {triggerSpan.payload_snippet && (
                   <div className="p-3 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] text-slate-600 mb-2 truncate">
                      {triggerSpan.payload_snippet}
                   </div>
                )}
                
                <JsonViewer data={triggerSpan} label="Raw Span Data" collapsed={true} />
              </div>
            </div>
            )}

            {/* ROW 2: AGENT (Reasoning Span) */}
            {agentSpan && (
            <div className="relative z-10 pl-16">
               <div className="absolute left-0 top-0 p-1.5 bg-slate-50 border border-slate-200 rounded-full z-10">
                 {agentSpan.stage === 'GOVERNANCE_CHECK' ? (
                   <ShieldAlert size={16} className="text-amber-500" />
                 ) : (
                   <BrainCircuit size={16} className="text-purple-500" />
                 )}
               </div>

               <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                <span>{agentSpan.stage || "Agent Core"}</span>
                {(agentSpan.token_usage) && (
                  <span className="font-mono text-[10px] text-slate-400 px-1 rounded">
                   {agentSpan.model ? `Model: ${agentSpan.model}` : ''}
                  </span>
                )}
               </div>

              <div className={`bg-white p-4 rounded border shadow-sm flex flex-col ${
                agentSpan.status === 'TIMEOUT' ? 'border-red-300 ring-1 ring-red-100' : 
                agentSpan.status === 'HIGH_LATENCY' ? 'border-orange-300' : 'border-slate-200'
              }`}>
                 <div className="text-xs font-semibold text-slate-700 mb-3 flex justify-between">
                   <span>{agentSpan.operation || "Processing"}</span>
                 </div>

                 {/* Interceptor Pattern: Detection Method */}
                 {agentSpan.detection_method && (
                   <div className="mb-3 flex items-center gap-2">
                      <div className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase">
                        {agentSpan.detection_method.replace('_', ' ')}
                      </div>
                      {agentSpan.check_logic && (
                         <div className="text-[10px] font-mono text-slate-500">
                           {agentSpan.check_logic}
                         </div>
                      )}
                   </div>
                 )}

                 {/* Reasoning / Thought Process */}
                 <div className="flex-1 font-mono text-[10px] leading-relaxed bg-slate-50 rounded p-3 border border-slate-100 overflow-y-auto max-h-[300px] custom-scrollbar mb-3">
                    {agentSpan.reasoning_trace && (
                      <div className="whitespace-pre-wrap text-slate-600">
                        {agentSpan.reasoning_trace}
                      </div>
                    )}
                 </div>
                 
                 {/* Interceptor Pattern: Result Object */}
                 {agentSpan.result && (
                    <div className="mb-2">
                       <JsonViewer data={agentSpan.result} label="Check Result" collapsed={true} />
                    </div>
                 )}
                 
                 {/* Tool Calls */}
                 {agentSpan.tool_calls && agentSpan.tool_calls.length > 0 && (
                   <div className="space-y-2 mb-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tool Usage</div>
                      {agentSpan.tool_calls.map((tool, i) => (
                        <div key={i} className="flex gap-2 text-[10px] bg-white border border-slate-200 p-2 rounded">
                           <span className="font-bold text-slate-700">{tool.tool}</span>
                           <span className="text-slate-500 truncate">{tool.input}</span>
                           <span className="text-emerald-600">→ {tool.result}</span>
                        </div>
                      ))}
                   </div>
                 )}
                 
                 {/* Token Usage */}
                 {agentSpan.token_usage && (
                   <div className="flex gap-3 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                      <span>Prompt: {agentSpan.token_usage.prompt}t</span>
                      <span>Compl: {agentSpan.token_usage.completion}t</span>
                   </div>
                 )}
              </div>
            </div>
            )}

            {/* ROW 3: OUTPUT (Action Span) */}
            {actionSpan && (
            <div className="relative z-10 pl-16">
               <div className="absolute left-0 top-0 p-1.5 bg-slate-50 border border-slate-200 rounded-full z-10">
                 <Server size={16} className={actionSpan.status?.includes('4') ? 'text-red-500' : 'text-emerald-500'} />
               </div>

               <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                <span>{actionSpan.stage || "Sink"}</span>
               </div>

              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm relative">
                 <div className="flex items-center justify-between mb-4">
                   <div className="text-xs font-semibold text-slate-700">{actionSpan.action || actionSpan.decision || "Output"}</div>
                   {actionSpan.topic && (
                      <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                        Topic: {actionSpan.topic}
                      </div>
                   )}
                   {actionSpan.target_topic && (
                      <div className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        actionSpan.decision?.includes('REJECT') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        → {actionSpan.target_topic}
                      </div>
                   )}
                 </div>

                 <div className="py-2 mb-3">
                    {/* Interceptor: Decision */}
                    {actionSpan.decision && (
                       <div className={`mb-2 text-xs font-bold ${
                          actionSpan.decision.includes('REJECT') ? 'text-red-600' :
                          actionSpan.decision.includes('WARNING') ? 'text-amber-600' : 'text-emerald-600'
                       }`}>
                         DECISION: {actionSpan.decision}
                       </div>
                    )}

                    {/* Failure Reason */}
                    {actionSpan.reason && (
                      <div className="text-[10px] text-red-500 font-mono bg-red-50 p-2 rounded border border-red-100 mb-2">
                        Reason: {actionSpan.reason}
                      </div>
                    )}
                    
                    {/* Output Payload */}
                    {actionSpan.output_payload && (
                       <JsonViewer data={actionSpan.output_payload} label="Output Message" collapsed={false} />
                    )}
                 </div>
              </div>
            </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
