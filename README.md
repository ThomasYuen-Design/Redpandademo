# Redpanda Agent Observability Demo

## User Painpoint: The Black Box Problem
In current agentic workflows, AI reasoning is often a "black box" for engineers. Without access to a live backend, I architected a data model from scratch that realistically represents the intersection of event streaming (offsets, partitions) and AI execution (token usage, tool calls).

This prototype establishes a UX Blueprint, identifying the exact data contracts required for the backend to make AI agents truly observable and production-ready for Redpanda customers.

## Project Overview
RedPandaAgentDemo is a real-time observability dashboard designed to monitor AI agents (Workers, Orchestrators, Sidecars) as they process streaming data. It visualizes the intersection of Event Streaming (Redpanda) and LLM Reasoning.

## Architecture and Engineering Standards
- **Strict TypeScript Migration**: 100% type-safe codebase with comprehensive interfaces (`AgentConfig`, `Trace`, `Span`) defined in `src/types`.
- **Feature-Based Architecture**: Scalable directory structure grouping logic by domain (`features/dashboard`) rather than technical type.
- **Atomic Design System**: Reusable UI primitives (`Badge`, `Card`, `DataTable`) extracted to `src/components/ui` to enforce consistency.
- **Separation of Concerns**: Business logic and data generation are isolated in custom hooks (`useAgentPipeline`), keeping view components pure.

## Key Features: Actionable Observability

### Macro Health (Dashboard)
A high-level cluster view using SRE-standard status modeling (Healthy, Degraded, Failed). The `useAgentPipeline` hook calculates real-time metrics to help users instantly distinguish between logic errors (high error rate) or infrastructure bottlenecks (p99 latency spikes).

### Micro Trace Swimlane Visualization
A custom implementation mapping the 3-stage vertical pipeline of an AI Agent:
- **Ingest**: Kafka source topic, partition, and offset.
- **Agent Core**: The "Brain" (LLM reasoning traces, tool calls, token usage).
- **Sink**: Output actions and dead-letter queue routing.

### Fault Isolation and Circuit Breakers
I simulated recurring failure patterns, such as Circuit Breakers, to demonstrate how the UI helps engineers distinguish between a transient API glitch and a systemic dependency failure. This demonstrates how the system protects itself by "failing fast" when downstream services are unreachable.

### Agent Personas
The demo simulates 4 distinct architectural patterns:
- **Stream Processor**: Sentiment analysis on social feeds.
- **Execution Router**: Low-latency crypto arbitrage.
- **Batch Orchestrator**: Recursive reasoning on SEC filings.
- **Policy Sidecar**: Regulatory validation interceptor.

## Tech Stack
- **Core**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS, Lucide React, clsx / tailwind-merge
- **Architecture**: Custom Hooks + Feature Folders

## Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Launch the development server: `npm run dev`.

---
**Design and Engineering by Thomas Yuen**
