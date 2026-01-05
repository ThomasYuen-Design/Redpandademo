import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  Clock, 
  Database, 
  Filter, 
  Search, 
  Server, 
  Zap,
  MoreHorizontal,
  Copy,
  BrainCircuit,
  ShieldAlert,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

import { TopBar } from './components/TopBar';
import { AgentDashboard } from './components/AgentDashboard';

// --- MOCK DATA GENERATION ---
// Using the specific traces provided for the demo stories

const generateMockData = () => {
  return [
    {
      "trace_id": "trc-88a9-f2b1-standard",
      "timestamp": "2026-01-04T14:00:01.200Z",
      "service": "svc-sentiment-ingest-v1",
      "status": "200 OK",
      "latency_ms": 450,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "raw_social_feed",
          "partition": 4,
          "offset": 99201,
          "payload_snippet": "{\"text\": \"NVIDIA announces unexpected breakthrough in cooling efficiency, shares jump pre-market.\", \"source\": \"wire_service\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "LLM_INFERENCE",
          "model": "gpt-4o-mini",
          "tool_calls": [
            {
              "tool": "vec_db_lookup",
              "input": "NVIDIA",
              "result": "FOUND: NVDA (Sector: Semi, Weight: High)"
            }
          ],
          "reasoning_trace": "Entity identified: NVDA. Context: Positive product news + Price Action mention. Sentiment calculated as +0.85.",
          "token_usage": { "prompt": 120, "completion": 45 }
        },
        {
          "stage": "SINK",
          "topic": "clean_sentiment_signals",
          "action": "PRODUCE_MESSAGE",
          "output_payload": {
            "entity": "NVDA",
            "sentiment_score": 0.85,
            "confidence": 0.99,
            "classification": "BULLISH_NEWS",
            "ts": "2026-01-04T14:00:01.650Z"
          }
        }
      ]
    },
    {
      "trace_id": "trc-11b2-x999-filtered",
      "timestamp": "2026-01-04T14:00:05.100Z",
      "service": "svc-sentiment-ingest-v1",
      "status": "204 NO CONTENT",
      "latency_ms": 120,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "raw_social_feed",
          "partition": 2,
          "offset": 99205,
          "payload_snippet": "{\"text\": \"I really hope the cafeteria serves pizza today.\", \"source\": \"internal_slack_scrape\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "PRE_PROCESSING",
          "note": "Skipping LLM Inference",
          "tool_calls": [],
          "reasoning_trace": "Keyword scan check: FAILED. No financial entities (tickers/companies) detected in text string. Aborting pipeline to save API credits.",
          "token_usage": { "prompt": 0, "completion": 0 }
        },
        {
          "stage": "SINK",
          "topic": "clean_sentiment_signals",
          "action": "DROP_PACKET",
          "reason": "FILTER_IRRELEVANT_CONTENT"
        }
      ]
    },
    {
      "trace_id": "trc-err-5551-ambiguous",
      "timestamp": "2026-01-04T14:02:15.800Z",
      "service": "svc-sentiment-ingest-v1",
      "status": "422 UNPROCESSABLE ENTITY",
      "latency_ms": 890,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "raw_social_feed",
          "partition": 1,
          "offset": 99400,
          "payload_snippet": "{\"text\": \"The apples look terrible this season due to the frost.\", \"source\": \"agri_news_rss\"}"
        },
        {
          "stage": "AGENT_CORE",
          "operation": "LLM_INFERENCE",
          "model": "gpt-4o-mini",
          "tool_calls": [
            {
              "tool": "vec_db_lookup",
              "input": "apples",
              "result": "MATCHES: [AAPL (Tech), AGRI_COMMODITY (Futures)]"
            }
          ],
          "reasoning_trace": "Conflict detected. Text mentions 'frost' (Agriculture context) but matched 'AAPL' (Tech). Confidence in AAPL classification is < 0.4. Defaulting to safety protocol.",
          "token_usage": { "prompt": 210, "completion": 20 }
        },
        {
          "stage": "SINK",
          "topic": "dlq_sentiment_failures", 
          "action": "PRODUCE_DEAD_LETTER",
          "reason": "LOW_CONFIDENCE_THRESHOLD",
          "meta": {
            "manual_review_required": true,
            "suggested_tag": "COMMODITIES"
          }
        }
      ]
    },
    // --- NEW FUNC EXEC ARB ROUTER LOGS ---
    {
      "trace_id": "trc-arb-001-fast",
      "timestamp": "2026-01-04T14:10:05.110Z",
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
      "timestamp": "2026-01-04T14:10:05.850Z",
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
      "timestamp": "2026-01-04T14:10:06.200Z",
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
      "timestamp": "2026-01-04T14:10:09.005Z",
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
      "timestamp": "2026-01-04T14:10:12.400Z",
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
    // --- NEW MACRO SYNTHESIS BATCH LOGS ---
    {
      "trace_id": "trc-macro-101-sec",
      "timestamp": "2026-01-04T13:15:00.000Z",
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
      "timestamp": "2026-01-04T13:22:15.500Z",
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
      "timestamp": "2026-01-04T13:30:00.000Z",
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
      "timestamp": "2026-01-04T13:35:10.200Z",
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
      "timestamp": "2026-01-04T13:42:00.000Z",
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
      "timestamp": "2026-01-04T13:48:00.000Z",
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
      "timestamp": "2026-01-04T13:52:30.000Z",
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
      "timestamp": "2026-01-04T13:59:45.000Z",
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
    // --- NEW POLICY ENGINE SIDECAR LOGS ---
    {
      "trace_id": "trc-pol-001-latency",
      "timestamp": "2026-01-04T14:45:00.000Z",
      "service": "policy-engine-sidecar",
      "status": "200 OK (DEGRADED)",
      "latency_ms": 8500,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "orders_pending_validation",
          "payload_snippet": "{\"symbol\": \"MSFT\", \"amount\": 50000, \"strategy\": \"MOMENTUM\"}"
        },
        {
          "stage": "GOVERNANCE_CHECK",
          "detection_method": "LATENCY_HEURISTIC",
          "check_logic": "timestamp_diff(start, now)",
          "result": {
            "is_valid_schema": true,
            "is_compliant": true,
            "processing_time": "8500ms",
            "threshold": "1000ms"
          },
          "reasoning_trace": "Rule check passed, but Vector DB query took 7.8s. This exceeds the 1s SLA. Flagging payload with `latency_warning` metadata.",
          "token_usage": { "prompt": 400, "completion": 50 }
        },
        {
          "stage": "ROUTING",
          "decision": "FORWARD_WITH_WARNING",
          "target_topic": "orders_approved",
          "meta": {
            "alert_ops": "SLA_BREACH_DETECTED"
          }
        }
      ]
    },
    {
      "trace_id": "trc-pol-002-crash",
      "timestamp": "2026-01-04T14:48:12.500Z",
      "service": "policy-engine-sidecar",
      "status": "500 INTERNAL ERROR",
      "latency_ms": 1200,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "orders_pending_validation",
          "payload_snippet": "{\"symbol\": \"NVDA\", \"amount\": 120000}"
        },
        {
          "stage": "GOVERNANCE_CHECK",
          "detection_method": "DEPENDENCY_EXCEPTION",
          "check_logic": "try_catch(vector_db_lookup)",
          "result": {
            "error": "ConnectionRefused: Rulebook DB Unreachable",
            "safety_verified": false
          },
          "reasoning_trace": "CRITICAL: Unable to fetch 'Wash Sale' rules for NVDA. Dependency failure detected. \nProtocol: FAIL_SAFE_MODE.\nDecision: I cannot verify compliance, so I must reject this order to prevent regulatory violation.",
          "token_usage": { "prompt": 450, "completion": 80 }
        },
        {
          "stage": "ROUTING",
          "decision": "REJECT_PACKET",
          "target_topic": "dlq_governance_failures",
          "meta": {
            "error_code": "INFRA_DEPENDENCY_DOWN",
            "retry_policy": "exponential_backoff"
          }
        }
      ]
    },
    {
      "trace_id": "trc-pol-003-lockdown",
      "timestamp": "2026-01-04T14:50:00.000Z",
      "service": "policy-engine-sidecar",
      "status": "503 SERVICE UNAVAILABLE",
      "latency_ms": 15,
      "spans": [
        {
          "stage": "INGEST",
          "topic": "orders_pending_validation",
          "payload_snippet": "{\"symbol\": \"ETH-USD\", \"amount\": 1000}"
        },
        {
          "stage": "GOVERNANCE_CHECK",
          "detection_method": "CIRCUIT_BREAKER",
          "check_logic": "failure_count > 5",
          "result": {
            "status": "OPEN (Active)",
            "last_failure": "2026-01-04T14:49:55Z",
            "llm_inference": "SKIPPED"
          },
          "reasoning_trace": "N/A (Reasoning Engine Disabled). System is in protective lockdown due to upstream Vector DB outage.",
          "token_usage": { "prompt": 0, "completion": 0 }
        },
        {
          "stage": "ROUTING",
          "decision": "INSTANT_REJECT",
          "target_topic": "dlq_governance_failures",
          "meta": {
            "alert_message": "Pipeline halted. Human intervention required."
          }
        }
      ]
    }
  ];
};

// --- COMPONENTS ---

// --- COMPONENTS ---

const StatusBadge = ({ status }) => {
  const isSuccess = status.includes('200') || status.includes('SUCCESS');
  const isWarning = status.includes('204') || status.includes('WARNING');
  const isError = status.includes('422') || status.includes('500') || status.includes('ERROR');

  const styles = {
    SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
    ERROR: 'bg-red-50 text-red-700 border-red-200',
    DEFAULT: 'bg-slate-50 text-slate-700 border-slate-200'
  };
  
  const icon = {
    SUCCESS: <CheckCircle2 size={10} className="mr-1.5" />,
    WARNING: <AlertCircle size={10} className="mr-1.5" />,
    ERROR: <ShieldAlert size={10} className="mr-1.5" />,
    DEFAULT: <div className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
  };

  const statusKey = isSuccess ? 'SUCCESS' : isWarning ? 'WARNING' : isError ? 'ERROR' : 'DEFAULT';

  return (
    <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${styles[statusKey]}`}>
      {icon[statusKey]}
      {status}
    </span>
  );
};

const JsonViewer = ({ data, label, collapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  return (
    <div className="font-mono text-xs text-slate-300 bg-[#1e293b] rounded border border-slate-700 overflow-hidden">
      <div 
        className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-slate-700 cursor-pointer hover:bg-[#1e293b] transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="font-semibold text-slate-400 select-none flex items-center gap-2">
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          {label}
        </span>
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

const TraceRow = ({ trace, expanded, onClick }) => {
  // Parsing the Waterfall Structure - Adapting to new "stage" based keys
  const triggerSpan = trace.spans.find(s => s.stage === 'INGEST' || s.type === 'trigger');
  const agentSpan = trace.spans.find(s => s.stage === 'AGENT_CORE' || s.type === 'llm_thought' || s.stage === 'GOVERNANCE_CHECK');
  const actionSpan = trace.spans.find(s => s.stage === 'SINK' || s.type === 'tool_execution' || s.type === 'system_event' || s.stage === 'ROUTING');

  const dateStr = new Date(trace.timestamp || trace.start_time).toISOString().replace('T', ' ').replace('Z', '');
  const duration = trace.latency_ms || trace.total_duration_ms;
  
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
                {triggerSpan.duration_ms && <span className="font-mono text-[10px] text-slate-400">+{triggerSpan.duration_ms}ms</span>}
               </div>
              
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm relative">
                <div className="text-xs font-semibold text-slate-700 mb-2">{triggerSpan.topic ? `Topic: ${triggerSpan.topic}` : triggerSpan.name}</div>
                
                {/* Custom Rendering for New Payload Snippet */}
                {triggerSpan.payload_snippet && (
                   <div className="p-3 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] text-slate-600 mb-2 truncate">
                      {triggerSpan.payload_snippet}
                   </div>
                )}
                
                {triggerSpan.data && (
                  <div className="font-mono text-[10px] space-y-1 text-slate-600 mb-3">
                    {triggerSpan.data.symbol && (
                       <div className="flex justify-between max-w-xs">
                         <span className="text-slate-400">Symbol:</span>
                         <span>{triggerSpan.data.symbol}</span>
                       </div>
                    )}
                    {triggerSpan.data.price && (
                       <div className="flex justify-between max-w-xs">
                         <span className="text-slate-400">Price:</span>
                         <span className="font-bold">{triggerSpan.data.price}</span>
                       </div>
                    )}
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
                {(agentSpan.duration_ms || agentSpan.token_usage) && (
                  <span className="font-mono text-[10px] text-slate-400 px-1 rounded">
                   {agentSpan.model ? `Model: ${agentSpan.model}` : `+${agentSpan.duration_ms}ms`}
                  </span>
                )}
               </div>

              <div className={`bg-white p-4 rounded border shadow-sm flex flex-col ${
                agentSpan.status === 'TIMEOUT' ? 'border-red-300 ring-1 ring-red-100' : 
                agentSpan.status === 'HIGH_LATENCY' ? 'border-orange-300' : 'border-slate-200'
              }`}>
                 <div className="text-xs font-semibold text-slate-700 mb-3 flex justify-between">
                   <span>{agentSpan.operation || agentSpan.name}</span>
                   {agentSpan.data && agentSpan.data.confidence && (
                     <span className="text-emerald-600 text-[10px]">{agentSpan.data.confidence * 100}% Conf.</span>
                   )}
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
                    {/* New Data: reasoning_trace */}
                    {agentSpan.reasoning_trace && (
                      <div className="whitespace-pre-wrap text-slate-600">
                        {agentSpan.reasoning_trace}
                      </div>
                    )}

                    {/* Old Data: thought_process */}
                    {agentSpan.data && (
                       <>
                        {Array.isArray(agentSpan.data.thought_process_dump) ? (
                            <div className="space-y-2">
                            {agentSpan.data.thought_process_dump.map((step, i) => (
                                <div key={i} className="text-slate-600">{step}</div>
                            ))}
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap text-slate-600">{agentSpan.data.thought_process}</div>
                        )}
                       </>
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
                   <div className="text-xs font-semibold text-slate-700">{actionSpan.action || actionSpan.name || actionSpan.decision}</div>
                   {actionSpan.topic && (
                      <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                        Topic: {actionSpan.topic}
                      </div>
                   )}
                   {actionSpan.target_topic && (
                      <div className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        actionSpan.decision.includes('REJECT') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
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
                 
                 {(actionSpan.data) && <JsonViewer data={actionSpan.data} label="Legacy Data" collapsed={true} />}
              </div>
            </div>
            )}


          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'stream'
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [expandedId, setExpandedId] = useState('trc-err-5551-ambiguous'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  
  const data = useMemo(() => generateMockData(), []);
  const filteredData = data.filter(d => {
    const matchesSearch = d.trace_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = selectedAgentId ? d.service === selectedAgentId : true;
    return matchesSearch && matchesAgent;
  });

  const agentMetrics = useMemo(() => {
    const metrics = {};
    data.forEach(trace => {
      if (!metrics[trace.service]) {
        metrics[trace.service] = { 
          latencies: [], 
          errors: 0, 
          count: 0 
        };
      }
      metrics[trace.service].count++;
      
      const latency = trace.latency_ms || trace.total_duration_ms || 0;
      metrics[trace.service].latencies.push(latency);
      
      const isError = trace.status.includes('422') || trace.status.includes('500') || trace.status.includes('ERROR') || trace.status.includes('FAILED') || trace.status.includes('TIMEOUT');
      if (isError) {
        metrics[trace.service].errors++;
      }
    });

    const result = {};
    Object.keys(metrics).forEach(svc => {
      const m = metrics[svc];
      m.latencies.sort((a,b) => a - b);
      // Simple p99 calc for small sample size = max
      const p99Index = Math.floor(m.latencies.length * 0.99); 
      const p99 = m.latencies[Math.min(p99Index, m.latencies.length - 1)] || 0;
      
      result[svc] = {
        p99_latency: p99,
        errors_24h: m.errors,
        throughput: m.count * 125 // Fake multiplier to simulate "real" volume from this sample
      };
    });
    return result;
  }, [data]);

  const agentsList = [
    {
      id: "svc-sentiment-ingest-v1",
      name: "svc-sentiment-ingest-v1",
      description: "High-throughput pipeline. Ingests raw text, enriches via Vector DB, and publishes structured sentiment signals.",
      status: "HEALTHY",
      model: "gpt-4o-mini",
      tools: ["vec_db_lookup", "tokenizer_check"],
      systemPrompt: "ENV: PRODUCTION\nLOG_LEVEL: INFO\n\nTASK: ENTITY_EXTRACTION_AND_SENTIMENT\n\n1. INPUT: Raw JSON from `raw_social_feed`.\n2. VALIDATION: Discard if token_count < 5 or > 500.\n3. ENRICHMENT: Call `vec_db_lookup` to confirm entity exists in S&P500 list.\n4. OUTPUT: Produce JSON to `clean_sentiment_signals`.\n   - Format: { \"entity\": \"ticker\", \"score\": float(-1.0 to 1.0), \"confidence\": float }",
    },
    {
      id: "func-exec-arb-router",
      name: "func-exec-arb-router",
      description: "Atomic execution handler for cross-venue liquidity mirroring. Handles price diff calculation and order routing.",
      status: "HEALTHY",
      model: "claude-3.5-sonnet-fast",
      tools: ["rpc-liquidity-check", "rpc-order-book-snapshot", "sys-gas-estimator", "tx-signer"],
      systemPrompt: "ROLE: EXECUTION_ROUTER\nPRIORITY: LATENCY\n\nYou are a stateless execution function. \n\nPROCEDURE:\n1. Ingest `spread_detected` event.\n2. Call `sys-gas-estimator` (BLOCKING CALL).\n3. IF (profit - gas) > threshold: Sign and Broadcast Transaction.\n\nCRITICAL:\n- You are responsible for the final \"Buy\" signal.\n- Check timestamp of input event. If delta > 100ms, ABORT immediately to prevent slippage.",
    },
    {
      id: "job-macro-synthesis-batch",
      name: "job-macro-synthesis-batch",
      description: "Asynchronous recursive reasoning engine. Ingests unstructured long-context documents (PDFs/Filings) to generate vector embeddings and summary reports.",
      status: "HEALTHY",
      model: "llama-3-70b-instruct-v2",
      tools: ["lib-sec-edgar", "api-news-aggregator", "lib-pdf-parser", "db-knowledge-graph"],
      systemPrompt: "ROLE: SYNTHESIS_ENGINE\nMODE: RECURSIVE_REASONING\n\nYou are a batch processing job designed to resolve data conflicts in large datasets.\n\nLOOP LOGIC:\n1. Parse input documents.\n2. Identify conflicting truth claims (e.g., Source A vs Source B).\n3. Recursively fetch deeper context until conflict is resolved.\n4. If resolution fails, increment `recursion_depth` and retry.\n\nWARNING: Watch for infinite recursion loops on ambiguous data.",
    },
    {
      id: "policy-engine-sidecar",
      name: "policy-engine-sidecar",
      description: "Interceptor service that validates outgoing payloads against defined regulatory schemas (Wash Sale, NAV limits) before committing to the order stream.",
      status: "FAILED",
      model: "gpt-4-turbo-preview",
      tools: ["calc-portfolio-exposure", "db-rulebook-vector", "sys-reject-packet", "sys-alert-ops"],
      systemPrompt: "ROLE: VALIDATION_LAYER\nTASK: SCHEMA_ENFORCEMENT\n\nYou are a middleware filter sitting between the `agent` and `execution` topics.\n\nVALIDATION STEPS:\n1. Inspect incoming JSON payload.\n2. Validate against Rule Set A (Portfolio % < 5).\n3. Validate against Rule Set B (Wash Sale Time Window).\n\nACTION:\n- IF PASS: Forward packet to `orders_approved`.\n- IF FAIL: Drop packet and emit event to `ops_alerts` with error code `VIOLATION_CRITICAL`.",
    }
  ];

  const agents = agentsList.map(a => ({
    ...a,
    metrics: agentMetrics[a.id] || { p99_latency: 0, errors_24h: 0, throughput: 0 }
  }));

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const handleNavigate = (view, agentId = null) => {
    setCurrentView(view);
    if (agentId) setSelectedAgentId(agentId);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <TopBar />

      {/* VIEW: DASHBOARD (Home) */}
      {currentView === 'dashboard' && (
        <AgentDashboard agents={agents} onNavigate={handleNavigate} />
      )}

      {/* VIEW: STREAM (Drill-down) */}
      {currentView === 'stream' && (
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-6 flex items-center gap-2">
             <button 
               onClick={() => handleNavigate('dashboard')}
               className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
             >
                <ArrowLeft size={16} />
                Back to Dashboard
             </button>
             <span className="text-slate-300">/</span>
             <span className="text-sm font-semibold text-slate-700">{selectedAgent?.name}</span>
          </div>
          
          {/* Page Title */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                 <h1 className="text-2xl font-semibold text-slate-900">{selectedAgent?.name}</h1>
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
          {selectedAgent && (
            <div className="mb-8 bg-slate-50/50 rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="font-semibold text-sm text-slate-700">Agent Configuration</div>
                     <div className="text-xs text-slate-400 font-mono">ID: {selectedAgent.id}</div>
                   </div>
                   <button className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-1">
                     Edit Configuration
                   </button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Description</div>
                      <p className="text-sm text-slate-700 leading-relaxed mb-4">{selectedAgent.description}</p>
                      
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Model</div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {selectedAgent.model}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Tools</div>
                          <div className="flex flex-wrap gap-1">
                             {selectedAgent.tools.map((t, i) => (
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
                      <div className={`bg-slate-900 rounded p-3 text-xs font-mono text-slate-300 leading-relaxed overflow-y-auto custom-scrollbar whitespace-pre-wrap transition-all duration-300 ease-in-out ${isPromptExpanded ? 'h-[500px]' : 'h-[120px]'}`}>
                        {selectedAgent.systemPrompt}
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
            {filteredData.map((trace) => (
              <TraceRow 
                key={trace.trace_id} 
                trace={trace} 
                expanded={expandedId === trace.trace_id}
                onClick={() => setExpandedId(expandedId === trace.trace_id ? null : trace.trace_id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
