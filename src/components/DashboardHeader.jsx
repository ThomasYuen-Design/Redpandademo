import React from 'react';
import { Activity, Zap, Server } from 'lucide-react';

export const DashboardHeader = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Active Pipelines */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Pipelines</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
             {stats.healthy} Healthy
             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-2"></span>
             {stats.degraded} Degraded
             <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-2"></span>
             {stats.failed} Failed
          </div>
        </div>
        <div className="p-2 bg-slate-50 rounded text-slate-400">
          <Zap size={20} />
        </div>
      </div>

      {/* Card 2: Global Throughput */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Global Throughput</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats.throughput} <span className="text-sm font-normal text-slate-500">msg/sec</span></div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
             +12% vs last hour
          </div>
        </div>
        <div className="p-2 bg-slate-50 rounded text-slate-400">
          <Activity size={20} />
        </div>
      </div>

      {/* Card 3: Cluster Latency */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cluster Latency (p99)</div>
          <div className={`mt-1 text-2xl font-bold ${stats.p99 > 1000 ? 'text-amber-600' : 'text-slate-900'}`}>{stats.p99.toLocaleString()}ms</div>
          <div className={`mt-1 text-xs font-medium ${stats.p99 > 1000 ? 'text-amber-600' : 'text-emerald-600'}`}>
             {stats.p99 > 1000 ? '⚠️ Exceeds threshold (1s)' : '✓ Within limits'}
          </div>
        </div>
        <div className={`p-2 rounded ${stats.p99 > 1000 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
          <Server size={20} />
        </div>
      </div>
    </div>
  );
};
