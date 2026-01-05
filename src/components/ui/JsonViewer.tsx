import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { cn } from './Badge';

interface JsonViewerProps {
  data: any;
  label?: string;
  collapsed?: boolean;
  className?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, label, collapsed = false, className }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  return (
    <div className={cn("font-mono text-xs text-slate-300 bg-[#1e293b] rounded border border-slate-700 overflow-hidden", className)}>
      <div 
        className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-slate-700 cursor-pointer hover:bg-[#1e293b] transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="font-semibold text-slate-400 select-none flex items-center gap-2">
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          {label || "JSON Data"}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">{JSON.stringify(data).length} bytes</span>
          <Copy size={10} className="text-slate-500 hover:text-slate-300" />
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="p-3 overflow-x-auto">
          <pre className="text-[10px] leading-4 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
