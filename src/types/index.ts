export type PipelineStatus = 'HEALTHY' | 'DEGRADED' | 'FAILED';

export interface HealthState {
  status: PipelineStatus;
  reason?: string;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
}

export interface ToolCall {
  tool: string;
  input: string;
  result: string;
}

export interface Span {
  stage: string;
  topic?: string;
  payload_snippet?: string;
  operation?: string;
  model?: string;
  tool_calls?: ToolCall[];
  reasoning_trace?: string;
  token_usage?: TokenUsage;
  action?: string;
  output_payload?: any; // strict: Record<string, any>
  partition?: number;
  offset?: number;
  status?: string;
  latency_ms?: number;
  // Specific fields from mock data
  note?: string;
  reason?: string;
  meta?: Record<string, any>;
  decision?: string;
  target_topic?: string;
  detection_method?: string;
  check_logic?: string;
  recursion_depth?: number;
  result?: any;
}

export interface Trace {
  trace_id: string;
  timestamp: string;
  service: string;
  status: string;
  latency_ms: number;
  spans: Span[];
}

export interface AgentMetrics {
  p99_latency: number;
  error_rate: number;
  error_count: number;
  throughput: number;
  active_traces: number;
  last_active: number; // Added for staleness check
}

export interface AgentConfig {
  id: string;
  name: string;
  type: 'orchestrator' | 'worker' | 'sidecar';
  health: HealthState; // Changed from status string
  metrics: AgentMetrics;
  capabilities: string[];
  description: string;
  model?: string;
  systemPrompt?: string;
}

export interface PipelineStats {
  total_agents: number;
  healthy_agents: number;
  degraded_agents: number;
  failed_agents: number;
  cluster_latency_p99: number;
  total_throughput: number;
}
