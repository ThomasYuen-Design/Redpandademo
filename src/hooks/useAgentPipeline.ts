import { useState, useMemo } from 'react';
import { AgentConfig, Trace, AgentMetrics, PipelineStats, HealthState } from '../types';

// Static configuration for agents (could be fetched from API in real app)
// Static configuration for agents (could be fetched from API in real app)
const AGENT_CONFIGS: Omit<AgentConfig, 'health' | 'metrics'>[] = [
  {
    id: "svc-sentiment-ingest-v1",
    name: "svc-sentiment-ingest-v1",
    type: "worker",
    description: "High-throughput pipeline. Ingests raw text, enriches via Vector DB, and publishes structured sentiment signals.",
    capabilities: ["vec_db_lookup", "tokenizer_check"],
    model: "gpt-4o-mini",
    systemPrompt: "ENV: PRODUCTION\nLOG_LEVEL: INFO\n\nTASK: ENTITY_EXTRACTION_AND_SENTIMENT\n\n1. INPUT: Raw JSON from `raw_social_feed`.\n2. VALIDATION: Discard if token_count < 5 or > 500.\n3. ENRICHMENT: Call `vec_db_lookup` to confirm entity exists in S&P500 list.\n4. OUTPUT: Produce JSON to `clean_sentiment_signals`.\n   - Format: { \"entity\": \"ticker\", \"score\": float(-1.0 to 1.0), \"confidence\": float }",
  },
  {
    id: "func-exec-arb-router",
    name: "func-exec-arb-router",
    type: "worker",
    description: "Atomic execution handler for cross-venue liquidity mirroring. Handles price diff calculation and order routing.",
    capabilities: ["rpc-liquidity-check", "rpc-order-book-snapshot", "sys-gas-estimator", "tx-signer"],
    model: "claude-3-haiku",
    systemPrompt: "ROLE: EXECUTION_ROUTER\nPRIORITY: LATENCY\n\nYou are a stateless execution function. \n\nPROCEDURE:\n1. Ingest `spread_detected` event.\n2. Call `sys-gas-estimator` (BLOCKING CALL).\n3. IF (profit - gas) > threshold: Sign and Broadcast Transaction.\n\nCRITICAL:\n- You are responsible for the final \"Buy\" signal.\n- Check timestamp of input event. If delta > 100ms, ABORT immediately to prevent slippage.",
  },
  {
    id: "job-macro-synthesis-batch",
    name: "job-macro-synthesis-batch",
    type: "orchestrator",
    description: "Asynchronous recursive reasoning engine. Ingests unstructured long-context documents to generate vector embeddings.",
    capabilities: ["lib-sec-edgar", "api-news-aggregator", "lib-pdf-parser", "db-knowledge-graph"],
    model: "gpt-4o",
    systemPrompt: "ROLE: SYNTHESIS_ENGINE\nMODE: RECURSIVE_REASONING\n\nYou are a batch processing job designed to resolve data conflicts in large datasets.\n\nLOOP LOGIC:\n1. Parse input documents.\n2. Identify conflicting truth claims (e.g., Source A vs Source B).\n3. Recursively fetch deeper context until conflict is resolved.\n4. If resolution fails, increment `recursion_depth` and retry.\n\nWARNING: Watch for infinite recursion loops on ambiguous data.",
  },
  {
    id: "policy-engine-sidecar",
    name: "policy-engine-sidecar",
    type: "sidecar",
    description: "Interceptor service that validates outgoing payloads against defined regulatory schemas before committing to orders.",
    capabilities: ["calc-portfolio-exposure", "db-rulebook-vector", "sys-reject-packet", "sys-alert-ops"],
    model: "claude-3-sonnet",
    systemPrompt: "ROLE: VALIDATION_LAYER\nTASK: SCHEMA_ENFORCEMENT\n\nYou are a middleware filter sitting between the `agent` and `execution` topics.\n\nVALIDATION STEPS:\n1. Inspect incoming JSON payload.\n2. Validate against Rule Set A (Portfolio % < 5).\n3. Validate against Rule Set B (Wash Sale Time Window).\n\nACTION:\n- IF PASS: Forward packet to `orders_approved`.\n- IF FAIL: Drop packet and emit event to `ops_alerts` with error code `VIOLATION_CRITICAL`.",
  },
];

const determineHealth = (metrics: AgentMetrics, thresholds: { latency: number }): HealthState => {
  const now = Date.now();
  const timeSinceLastActive = now - metrics.last_active;

  // 1. CHECK FAILURE CONDITIONS (The "Red" Flags)
  
  // If no activity for 5 minutes, the agent is likely stalled/dead
  // Note: For mock demo, we might want to relax this or ensure mock dates are fresh
  if (timeSinceLastActive > 5 * 60 * 1000) {
    return { status: 'FAILED', reason: 'Stalled: No activity > 5m' };
  }

  // If error rate is massive (e.g., > 20%), the logic is broken or auth failed
  if (metrics.error_rate > 0.20) {
    return { status: 'FAILED', reason: `Critical Error Rate: ${(metrics.error_rate * 100).toFixed(1)}%` };
  }

  // 2. CHECK DEGRADED CONDITIONS (The "Yellow" Flags)
  
  // If latency is high (common in LLM apps)
  if (metrics.p99_latency > thresholds.latency) {
    return { 
      status: 'DEGRADED', 
      reason: `High Latency: ${(metrics.p99_latency / 1000).toFixed(2)}s (Target: <${thresholds.latency/1000}s)` 
    };
  }

  // If error rate is creeping up (flaky API or hallucinations)
  if (metrics.error_rate > 0.02) { // > 2%
    return { 
      status: 'DEGRADED', 
      reason: `Elevated Errors: ${(metrics.error_rate * 100).toFixed(1)}%` 
    };
  }

  // 3. OTHERWISE HEALTHY
  return { status: 'HEALTHY' };
};

export const generateMockTraces = (): Trace[] => {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  
  return [
    {
      "trace_id": "trace-err-cascade-1",
      "service": "svc-sentiment-ingest-v1",
      "timestamp": new Date(now - 2000).toISOString(),
      "status": "FAILED",
      "latency_ms": 45,
      "spans": [
        {
          "stage": "INGEST",
          "operation": "Kafka Consumer",
          "topic": "raw-social-feed",
          "offset": 8901,
          "status": "OK"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "Vector DB Lookup",
          "status": "FAILED",
          "reason": "ConnectionRefused: vector-svc:6379 is unreachable",
          "tool_calls": [
            {
              "tool": "vec_db_lookup",
              "input": "Attempting to retrieve context for entity 'NVDA'...",
              "result": "FAILED: Connection Refused"
            }
          ],
          "reasoning_trace": "Attempting to retrieve context for entity 'NVDA'...",
          "meta": { "attempt": 1 }
        },
        {
          "stage": "SINK",
          "operation": "Dead Letter Queue",
          "topic": "dlq-sentiment",
          "status": "OK",
          "reason": "dependency_failure"
        }
      ]
    },
    {
      "trace_id": "trace-err-cascade-2",
      "service": "svc-sentiment-ingest-v1",
      "timestamp": new Date(now - 1000).toISOString(),
      "status": "FAILED",
      "latency_ms": 2,
      "spans": [
        {
          "stage": "INGEST",
          "operation": "Kafka Consumer",
          "topic": "raw-social-feed",
          "offset": 8902,
          "status": "OK"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "Policy Check",
          "status": "FAILED",
          "reason": "CircuitBreakerOpen: 'vector-svc' failure rate > 50%",
          "tool_calls": [],
          "reasoning_trace": "Skipping execution. Downstream dependency is unhealthy.",
          "meta": { "tool": "system_guard" }
        }
      ]
    },
    {
      "trace_id": "trace-err-cascade-3",
      "service": "svc-sentiment-ingest-v1",
      "timestamp": new Date().toISOString(),
      "status": "FAILED",
      "latency_ms": 2,
      "spans": [
        {
          "stage": "INGEST",
          "operation": "Kafka Consumer",
          "topic": "raw-social-feed",
          "offset": 8903,
          "status": "OK"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "Policy Check",
          "status": "FAILED",
          "reason": "CircuitBreakerOpen: 'vector-svc' failure rate > 50%",
          "tool_calls": [],
          "reasoning_trace": "Skipping execution. Downstream dependency is unhealthy.",
          "meta": { "tool": "system_guard" }
        }
      ]
    },
    {
      "trace_id": "trc-arb-001-fast",
      "timestamp": minutesAgo(0.1),
      "service": "func-exec-arb-router",
      "status": "200 OK",
      "latency_ms": 42,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "spread_events_fast",
          "payload_snippet": "{\"symbol\": \"ETH-USDT\", \"dex_price\": 3200.00, \"cex_price\": 3225.60, \"spread_pct\": 0.008}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "EXECUTION_LOGIC",
          "tool_calls": [
            {
              "tool": "sys-gas-estimator",
              "input": "ETH_L1_SWAP",
              "result": "GAS_COST: $12.50 (Status: GREEN)"
            }
          ],
          "reasoning_trace": "Gross Profit: $25.60 per ETH. Est Gas: $12.50. Net Profit > Threshold ($5.00). SIGNAL: GO.",
          "token_usage": { "prompt": 45, "completion": 10 }
        },
        {
          "stage": "SINK",
          "topic": "broadcast_tx_mempool",
          "action": "SIGN_AND_SEND",
          "output_payload": {
            "tx_hash": "0x7a9...b21",
            "action": "ATOMIC_SWAP",
            "net_profit_est": 13.10
          }
        }
      ]
    },
    {
      "trace_id": "trc-arb-002-volume",
      "timestamp": minutesAgo(0.2),
      "service": "func-exec-arb-router",
      "status": "200 OK",
      "latency_ms": 55,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "spread_events_fast",
          "payload_snippet": "{\"symbol\": \"WBTC-USDC\", \"volume\": 2.0, \"spread_pct\": 0.004}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "EXECUTION_LOGIC",
          "tool_calls": [
            {
              "tool": "sys-gas-estimator",
              "input": "ERC20_SWAP",
              "result": "GAS_COST: $18.00 (Status: GREEN)"
            }
          ],
          "reasoning_trace": "Spread is tight (0.4%) but volume is 2 WBTC ($190k). Gross Profit: $760. Gas is negligible. MAX PRIORITY FEE applied.",
          "token_usage": { "prompt": 48, "completion": 12 }
        },
        {
          "stage": "SINK",
          "topic": "broadcast_tx_mempool",
          "action": "SIGN_AND_SEND",
          "output_payload": {
            "tx_hash": "0x9c3...f55",
            "priority_fee": "High",
            "net_profit_est": 742.00
          }
        }
      ]
    },
    {
      "trace_id": "trc-arb-003-layer2",
      "timestamp": minutesAgo(0.3),
      "service": "func-exec-arb-router",
      "status": "200 OK",
      "latency_ms": 28,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "spread_events_l2",
          "payload_snippet": "{\"chain\": \"ARBITRUM\", \"symbol\": \"ARB-ETH\", \"spread_pct\": 0.0015}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "EXECUTION_LOGIC",
          "tool_calls": [
            {
              "tool": "sys-gas-estimator",
              "input": "ARB_L2_SWAP",
              "result": "GAS_COST: $0.09 (Status: OPTIMAL)"
            }
          ],
          "reasoning_trace": "Micro-arb opportunity. Profit: $1.50. Cost: $0.09. Margin: 94%. Executing.",
          "token_usage": { "prompt": 40, "completion": 8 }
        },
        {
          "stage": "SINK",
          "topic": "broadcast_tx_mempool",
          "action": "SIGN_AND_SEND",
          "output_payload": {
            "tx_hash": "0x1d4...aa9",
            "chain_id": 42161,
            "net_profit_est": 1.41
          }
        }
      ]
    },
    {
      "trace_id": "trc-arb-004-snipe",
      "timestamp": minutesAgo(0.8),
      "service": "func-exec-arb-router",
      "status": "200 OK",
      "latency_ms": 35,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "spread_events_fast",
          "payload_snippet": "{\"symbol\": \"LINK-USDT\", \"event\": \"LIQUIDITY_SHOCK\", \"spread_pct\": 0.025}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "EXECUTION_LOGIC",
          "tool_calls": [
            {
              "tool": "sys-gas-estimator",
              "input": "ETH_L1_SWAP",
              "result": "GAS_COST: $15.00 (Status: GREEN)"
            }
          ],
          "reasoning_trace": "Price discrepancy > 2%. Safety checks bypassed for SPEED. Slippage tolerance increased to 0.5%.",
          "token_usage": { "prompt": 50, "completion": 15 }
        },
        {
          "stage": "SINK",
          "topic": "broadcast_tx_mempool",
          "action": "SIGN_AND_SEND",
          "output_payload": {
            "tx_hash": "0x5e2...bb1",
            "strategy": "SNIPE_LIQUIDITY",
            "net_profit_est": 125.00
          }
        }
      ]
    },
    {
      "trace_id": "trc-arb-005-triangular",
      "timestamp": minutesAgo(1.0),
      "service": "func-exec-arb-router",
      "status": "200 OK",
      "latency_ms": 88,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "spread_events_fast",
          "payload_snippet": "{\"strategy\": \"TRIANGULAR\", \"path\": \"SOL -> USDC -> RAY -> SOL\", \"est_yield\": 0.009}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "EXECUTION_LOGIC",
          "tool_calls": [
            {
              "tool": "sys-gas-estimator",
              "input": "SOL_TX",
              "result": "GAS_COST: $0.001 (Status: NEGLIGIBLE)"
            }
          ],
          "reasoning_trace": "Path Validated. Liquidity deep enough on all 3 legs. Execution Order: Atomic bundle.",
          "token_usage": { "prompt": 60, "completion": 10 }
        },
        {
          "stage": "SINK",
          "topic": "broadcast_tx_mempool",
          "action": "SIGN_AND_SEND",
          "output_payload": {
            "tx_hash": "5Kj...9nn",
            "chain": "SOLANA",
            "steps": 3,
            "net_profit_est": 45.00
          }
        }
      ]
    },
    {
      "trace_id": "trc-macro-101-sec",
      "timestamp": minutesAgo(2),
      "service": "job-macro-synthesis-batch",
      "status": "200 OK",
      "latency_ms": 12500,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "doc_ingest_queue",
          "payload_snippet": "{\"source\": \"SEC_EDGAR\", \"doc_type\": \"10-Q\", \"ticker\": \"TSLA\", \"file_size_mb\": 15.2}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "RECURSIVE_REASONING",
          "recursion_depth": 1,
          "tool_calls": [
            { "tool": "lib-pdf-parser", "input": "extract_tables", "result": "revenue_raw: 25.1B" },
            { "tool": "api-news-aggregator", "input": "TSLA Q3 estimates", "result": "consensus: 24.8B" }
          ],
          "reasoning_trace": "Conflict detected: Actual (25.1B) > Consensus (24.8B). Recursive Step: Verifying GAAP vs Non-GAAP adjustments. Resolution: Discrepancy explained by regulatory credit sales.",
          "token_usage": { "prompt": 4500, "completion": 220 }
        },
        {
          "stage": "SINK",
          "topic": "macro_thesis_updates",
          "action": "PUBLISH_REPORT",
          "output_payload": { "ticker": "TSLA", "sentiment": "BEAT_ESTIMATES", "confidence": 0.95 }
        }
      ]
    },
    {
      "trace_id": "trc-macro-102-geo",
      "timestamp": minutesAgo(2.5),
      "service": "job-macro-synthesis-batch",
      "status": "200 OK",
      "latency_ms": 8400,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "news_firehose_global",
          "payload_snippet": "{\"headline\": \"OPEC+ rumors cut production\", \"conflicting_source\": \"Energy Minister denies cuts\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "RECURSIVE_REASONING",
          "recursion_depth": 2,
          "tool_calls": [
            { "tool": "db-knowledge-graph", "input": "OPEC_Minister_Statements_Historical", "result": "Reliability_Score: 0.8" }
          ],
          "reasoning_trace": "Source A (Rumor) conflicts with Source B (Official Denial). Historical weighting favors Official Denial. Synthesis: Volatility expected, but supply unchanged.",
          "token_usage": { "prompt": 1200, "completion": 150 }
        },
        {
          "stage": "SINK",
          "topic": "vector_embeddings_store",
          "action": "UPSERT_VECTOR",
          "output_payload": { "topic": "OIL_SUPPLY", "vector_id": "vec_9921_oil", "meta": "high_volatility" }
        }
      ]
    },
    {
      "trace_id": "trc-macro-103-fed",
      "timestamp": minutesAgo(3),
      "service": "job-macro-synthesis-batch",
      "status": "200 OK",
      "latency_ms": 45200,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "doc_ingest_queue",
          "payload_snippet": "{\"source\": \"FOMC_MINUTES\", \"pages\": 84, \"date\": \"Jan 2026\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "BATCH_PROCESSING",
          "recursion_depth": 0,
          "tool_calls": [
            { "tool": "lib-pdf-parser", "input": "chunk_text", "result": "chunks_created: 142" }
          ],
          "reasoning_trace": "Document length exceeds context window. Processing in 142 chunks. Identifying key themes: 'Inflation Sticky', 'Labor Cooling'. Synthesis complete.",
          "token_usage": { "prompt": 125000, "completion": 4000 }
        },
        {
          "stage": "SINK",
          "topic": "macro_thesis_updates",
          "action": "PUBLISH_SUMMARY",
          "output_payload": { "event": "FOMC_MINUTES", "tone": "HAWKISH_PAUSE", "key_phrase": "Higher for longer" }
        }
      ]
    },
    {
      "trace_id": "trc-macro-104-graph",
      "timestamp": minutesAgo(3.2),
      "service": "job-macro-synthesis-batch",
      "status": "201 CREATED",
      "latency_ms": 5600,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "news_firehose_tech",
          "payload_snippet": "{\"text\": \"Startup 'QuantCompute' raises Series B led by Sequoia.\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "ENTITY_RESOLUTION",
          "recursion_depth": 0,
          "tool_calls": [
            { "tool": "db-knowledge-graph", "input": "check_entity: QuantCompute", "result": "NOT_FOUND" }
          ],
          "reasoning_trace": "New entity detected. Relationship inference: QuantCompute -> Sector: Quantum -> Investor: Sequoia. Validating via Crunchbase cross-ref. Confirmed.",
          "token_usage": { "prompt": 800, "completion": 50 }
        },
        {
          "stage": "SINK",
          "topic": "knowledge_graph_updates",
          "action": "CREATE_NODE",
          "output_payload": { "node_type": "COMPANY", "id": "QuantCompute", "edges": ["Sequoia_Capital"] }
        }
      ]
    },
    {
      "trace_id": "trc-macro-105-fx",
      "timestamp": minutesAgo(3.5),
      "service": "job-macro-synthesis-batch",
      "status": "200 OK",
      "latency_ms": 3200,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "market_data_fx",
          "payload_snippet": "{\"pair\": \"USDJPY\", \"rate\": 152.40, \"change_24h\": \"+1.2%\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "HISTORICAL_LOOKBACK",
          "tool_calls": [
            { "tool": "db-knowledge-graph", "input": "USDJPY_intervention_levels", "result": "History: BOJ intervened at 151.90 in 2024" }
          ],
          "reasoning_trace": "Current rate (152.40) exceeds historical intervention zone (151.90). Probability of central bank action elevated. Flagging for risk model.",
          "token_usage": { "prompt": 600, "completion": 40 }
        },
        {
          "stage": "SINK",
          "topic": "macro_thesis_updates",
          "action": "EMIT_RISK_ALERT",
          "output_payload": { "asset": "JPY", "risk_level": "CRITICAL", "reason": "INTERVENTION_ZONE_BREACH" }
        }
      ]
    },
    {
      "trace_id": "trc-macro-106-align",
      "timestamp": minutesAgo(3.8),
      "service": "job-macro-synthesis-batch",
      "status": "200 OK",
      "latency_ms": 2100,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "news_firehose_earnings",
          "payload_snippet": "{\"ticker\": \"AAPL\", \"eps\": \"$2.10\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "VALIDATION",
          "recursion_depth": 0,
          "tool_calls": [
            { "tool": "api-news-aggregator", "input": "verify_AAPL_EPS", "result": "Bloomberg: $2.10, Reuters: $2.10, CNBC: $2.10" }
          ],
          "reasoning_trace": "Triangulation complete. All 3 primary sources align. Truth claim verified immediately.",
          "token_usage": { "prompt": 300, "completion": 20 }
        },
        {
          "stage": "SINK",
          "topic": "vector_embeddings_store",
          "action": "ARCHIVE_FACT",
          "output_payload": { "fact_id": "aapl_q1_eps", "verified": true }
        }
      ]
    },
    {
      "trace_id": "trc-macro-107-13f",
      "timestamp": minutesAgo(4.0),
      "service": "job-macro-synthesis-batch",
      "status": "200 OK",
      "latency_ms": 9800,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "doc_ingest_queue",
          "payload_snippet": "{\"source\": \"SEC_EDGAR\", \"doc_type\": \"13F\", \"fund\": \"Bridgewater\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "PORTFOLIO_DIFF",
          "tool_calls": [
            { "tool": "db-knowledge-graph", "input": "get_prev_holdings: Bridgewater", "result": "GLD: 5%" }
          ],
          "reasoning_trace": "Comparing Q3 vs Q4. Detected major rotation: Sold GLD, Bought EEM. Calculating sector drift. Emerging Markets exposure increased by 12%.",
          "token_usage": { "prompt": 2500, "completion": 180 }
        },
        {
          "stage": "SINK",
          "topic": "macro_thesis_updates",
          "action": "PUBLISH_FLOW_DATA",
          "output_payload": { "fund": "Bridgewater", "theme": "LONG_EMERGING_MARKETS" }
        }
      ]
    },
    {
      "trace_id": "trc-macro-108-deep",
      "timestamp": minutesAgo(4.5),
      "service": "job-macro-synthesis-batch",
      "status": "200 OK",
      "latency_ms": 31000,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "news_firehose_ma",
          "payload_snippet": "{\"event\": \"Merger Rumor\", \"companies\": \"CompanyX + CompanyY\", \"valuation\": \"$50B\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "RECURSIVE_REASONING",
          "recursion_depth": 3,
          "tool_calls": [
            { "tool": "api-news-aggregator", "input": "CompanyX valuation", "result": "Source A: $50B, Source B: $40B" },
            { "tool": "lib-sec-edgar", "input": "CompanyX last filing", "result": "Enterprise Value: $42B" },
            { "tool": "db-knowledge-graph", "input": "Premium_Analysis", "result": "Typical M&A Premium: 20%" }
          ],
          "reasoning_trace": "Level 1: Valuation conflict ($40B vs $50B). Level 2: Checked filings ($42B). Level 3: Applied M&A premium model (42 * 1.2 = 50.4). Resolution: $50B figure includes the control premium. Validated.",
          "token_usage": { "prompt": 3200, "completion": 400 }
        },
        {
          "stage": "SINK",
          "topic": "macro_thesis_updates",
          "action": "PUBLISH_REPORT",
          "output_payload": { "type": "M_AND_A_ANALYSIS", "implied_price": 50400000000, "status": "CREDIBLE" }
        }
      ]
    },
    {
      "trace_id": "trace-ok-101",
      "timestamp": new Date(now - 500).toISOString(),
      "service": "policy-engine-sidecar",
      "status": "200 OK",
      "latency_ms": 145,
      "spans": [
        {
          "stage": "INGEST",
          "operation": "Redpanda Consumer",
          "topic": "orders_pending",
          "partition": 0,
          "offset": 12045,
          "payload_snippet": "{\"symbol\": \"MSFT\", \"side\": \"BUY\", \"qty\": 100, \"type\": \"LMT\"}",
          "status": "OK"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "Validation Logic",
          "model": "claude-3-sonnet",
          "tool_calls": [
            {
              "tool": "calc-portfolio-exposure",
              "input": "MSFT",
              "result": "2.1%"
            },
            {
              "tool": "db-rulebook-vector",
              "input": "Wash sale check",
              "result": "Negative"
            }
          ],
          "reasoning_trace": "Order received for MSFT. \n1. Fetched current portfolio exposure: 2.1%. \n2. Projected exposure after trade: 3.4% (Limit: 5%). \n3. Wash sale check: Negative. \n\nCompliance checks passed.",
          "token_usage": { "prompt": 400, "completion": 50 },
          "status": "OK"
        },
        {
          "stage": "SINK",
          "operation": "Produce Approved",
          "topic": "orders_approved",
          "action": "forward_packet",
          "partition": 2,
          "status": "OK"
        }
      ]
    },
    {
      "trace_id": "trace-ok-102",
      "timestamp": new Date(now - 2500).toISOString(),
      "service": "policy-engine-sidecar",
      "status": "200 OK",
      "latency_ms": 310,
      "spans": [
        {
          "stage": "INGEST",
          "operation": "Redpanda Consumer",
          "topic": "orders_pending",
          "partition": 1,
          "offset": 12042,
          "payload_snippet": "{\"symbol\": \"NVDA\", \"side\": \"BUY\", \"qty\": 50}",
          "status": "OK"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "Risk Assessment",
          "model": "claude-3-sonnet",
          "tool_calls": [
            {
              "tool": "calc-portfolio-exposure",
              "input": "NVDA",
              "result": "4.8%"
            }
          ],
          "reasoning_trace": "High volatility asset detected. \n- Current Volatility Score: 0.8 \n- Exposure Check: 4.8% (Approaching 5% limit). \n- Rulebook Match: 'Allow if < 5%'. \n\nOrder validated within tolerance.",
          "token_usage": { "prompt": 580, "completion": 40 },
          "status": "OK"
        },
        {
          "stage": "SINK",
          "operation": "Produce Approved",
          "topic": "orders_approved",
          "action": "forward_packet",
          "meta": { "flag": "near_limit" },
          "status": "OK"
        }
      ]
    },
    {
      "trace_id": "trace-ok-103",
      "timestamp": new Date(now - 5000).toISOString(),
      "service": "policy-engine-sidecar",
      "status": "200 OK",
      "latency_ms": 85,
      "spans": [
        {
          "stage": "INGEST",
          "operation": "Redpanda Consumer",
          "topic": "orders_pending",
          "partition": 0,
          "offset": 12040,
          "payload_snippet": "{\"symbol\": \"GOOGL\", \"side\": \"SELL\", \"qty\": 200}",
          "status": "OK"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "Liquidation Check",
          "model": "claude-3-sonnet",
          "tool_calls": [],
          "reasoning_trace": "Sell order detected. \n- Exposure limits: N/A (Reducing risk). \n- Wash sale window: Validated. \n\nImmediate approval.",
          "token_usage": { "prompt": 100, "completion": 20 },
          "status": "OK"
        },
        {
          "stage": "SINK",
          "operation": "Produce Approved",
          "topic": "orders_approved",
          "action": "forward_packet",
          "status": "OK"
        }
      ]
    }
  ];
};

export const useAgentPipeline = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // In a real app, this would be a data fetching effect
  const traces = useMemo(() => generateMockTraces(), []);
  
  const agents = useMemo<AgentConfig[]>(() => {
    // Determine status and metrics from traces per agent service
    // Determine status and metrics from traces per agent service
    const metricsMap: Record<string, { latencies: number[], errors: number, count: number, last_active: number }> = {};
    const latestStatus: Record<string, string> = {};

    traces.forEach(trace => {
      const svc = trace.service;
      if (!metricsMap[svc]) {
        metricsMap[svc] = { latencies: [], errors: 0, count: 0, last_active: 0 };
      }
      
      metricsMap[svc].count++;
      metricsMap[svc].latencies.push(trace.latency_ms || 0);
      const traceTime = new Date(trace.timestamp).getTime();
      if (traceTime > metricsMap[svc].last_active) {
        metricsMap[svc].last_active = traceTime;
      }
      
      const isError = /^[45]/.test(trace.status) || trace.status.includes('ERROR') || trace.status === 'FAILED';
      if (isError) metricsMap[svc].errors++;
      
      // Assume traces are ordered or find latest? For mock, we'll just check if any recent failed makes it failed, 
      // or just assume hardcoded status in config is overridden by dynamic data if needed. 
      // For now, let's keep the hardcoded status unless we want to derive it dynamically.
      // But the original app had hardcoded statuses in agentsList.
    });

    return AGENT_CONFIGS.map(config => {
      const m = metricsMap[config.id] || { latencies: [], errors: 0, count: 0, last_active: Date.now() - 1000 * 60 * 10 }; // Default to stale if no traces
      const sortedLatencies = [...m.latencies].sort((a,b) => a - b);
      const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;
      
      const metrics: AgentMetrics = {
          p99_latency: p99,
          error_rate: m.count ? m.errors / m.count : 0,
          error_count: m.errors,
          throughput: m.count * 10,
          active_traces: m.count,
          last_active: m.last_active
      };

      // Determine health using the logic matrix
      // Thresholds could be passed via config, hardcoded for now: Latency < 2s
      const health = determineHealth(metrics, { latency: 2000 });
      
      return {
        ...config,
        health,
        metrics
      };
    });
  }, [traces]);

  const stats = useMemo<PipelineStats>(() => ({
    total_agents: agents.length,
    healthy_agents: agents.filter(a => a.health.status === 'HEALTHY').length,
    degraded_agents: agents.filter(a => a.health.status === 'DEGRADED').length,
    failed_agents: agents.filter(a => a.health.status === 'FAILED').length,
    cluster_latency_p99: Math.max(...agents.map(a => a.metrics.p99_latency), 0),
    total_throughput: agents.reduce((acc, a) => acc + a.metrics.throughput, 0)
  }), [agents]);

  return {
    agents,
    traces,
    stats,
    searchTerm,
    setSearchTerm
  };
};
