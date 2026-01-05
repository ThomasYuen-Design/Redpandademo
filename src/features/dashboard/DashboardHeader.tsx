import React from 'react';
import { Activity, Zap, Server } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { PipelineStats } from '../../types';

interface DashboardHeaderProps {
  stats: PipelineStats;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Active Pipelines */}
      <Card>
        <CardContent className="flex items-start justify-between p-4">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Pipelines</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total_agents}</div>
            <div className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               {stats.healthy_agents} Healthy
               <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-2"></span>
               {stats.degraded_agents} Degraded
               <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-2"></span>
               {stats.failed_agents} Failed
            </div>
          </div>
          <div className="p-2 bg-slate-50 rounded text-slate-400">
            <Zap size={20} />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Global Throughput */}
      <Card>
        <CardContent className="flex items-start justify-between p-4">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Global Throughput</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total_throughput} <span className="text-sm font-normal text-slate-500">msg/sec</span></div>
            <div className="mt-1 text-xs text-emerald-600 font-medium">
               +12% vs last hour
            </div>
          </div>
          <div className="p-2 bg-slate-50 rounded text-slate-400">
            <Activity size={20} />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Cluster Latency */}
      <Card>
        <CardContent className="flex items-start justify-between p-4">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cluster Latency (p99)</div>
            <div className={`mt-1 text-2xl font-bold ${stats.cluster_latency_p99 > 1000 ? 'text-amber-600' : 'text-slate-900'}`}>{stats.cluster_latency_p99.toLocaleString()}ms</div>
            <div className={`mt-1 text-xs font-medium ${stats.cluster_latency_p99 > 1000 ? 'text-amber-600' : 'text-emerald-600'}`}>
               {stats.cluster_latency_p99 > 1000 ? '⚠️ Exceeds threshold (1s)' : '✓ Within limits'}
            </div>
          </div>
          <div className={`p-2 rounded ${stats.cluster_latency_p99 > 1000 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
            <Server size={20} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
