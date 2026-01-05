import React from 'react';

export const TopBar: React.FC = () => {
  return (
    <header className="bg-[#101828] text-white h-14 flex items-center px-4 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-6 h-6 bg-[#E2401B] rounded flex items-center justify-center text-xs font-bold">R</div>
          <span>Redpanda Console</span>
        </div>
        <div className="h-4 w-px bg-slate-700 mx-2" />
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">Cluster: primary-useast-1</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
         <span>Docs</span>
         <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">JS</div>
      </div>
    </header>
  );
};
