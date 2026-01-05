# 🐼 RedPanda Agent Observability Demo

> A **Design Engineering Prototype** simulating the "Agentic Data Plane."
> This project demonstrates how Redpanda could visualize, trace, and debug AI Agent pipelines in a streaming environment.

## 🎯 Project Overview
**RedPandaAgentDemo** is a real-time observability dashboard designed to monitor AI agents (Workers, Orchestrators, Sidecars) as they process streaming data. It visualizes the intersection of **Event Streaming (Redpanda)** and **LLM Reasoning**.

### 🏗️ Architecture & Engineering Standards
This project was architected to demonstrate **frontend practices** suitable for enterprise data tools:

* **Strict TypeScript Migration:** 100% type-safe codebase with comprehensive interfaces (`AgentConfig`, `Trace`, `Span`) defined in `src/types`.
* **Feature-Based Architecture:** Scalable directory structure grouping logic by domain (`features/dashboard`) rather than technical type.
* **Atomic Design System:** Reusable UI primitives (`Badge`, `Card`, `DataTable`) extracted to `src/components/ui` to enforce consistency.
* **Separation of Concerns:** Business logic and data generation are isolated in custom hooks (`useAgentPipeline`), keeping view components pure.

## 📦 Tech Stack
* **Core:** React 19, TypeScript, Vite
* **Styling:** TailwindCSS, Lucide React, clsx/tailwind-merge
* **Architecture:** Custom Hooks + Feature Folders

## 🎨 Key Features

### 1. The "Swimlane" Trace Visualization
A custom implementation visualizing the 3-stage lifecycle of an AI Agent:
* **Ingest:** Source topic, partition, offset.
* **Agent Core:** The "Brain" (LLM reasoning traces, tool calls, token usage).
* **Sink:** Output actions and dead-letter queue routing.

### 2. Dynamic Metrics Engine
The `useAgentPipeline` hook calculates real-time observability metrics from the trace stream:
* **p99 Latency:** Calculated per agent.
* **Throughput:** Messages per second.
* **Health Status:** Auto-determined based on error rates and latency thresholds.

### 3. Agent Personas
The demo simulates 4 distinct architectural patterns:
* **Stream Processor:** Sentiment analysis on social feeds.
* **Execution Router:** Low-latency crypto arbitrage.
* **Batch Orchestrator:** Recursive reasoning on SEC filings.
* **Policy Sidecar:** Regulatory validation interceptor.

---
*Design & Engineering by Thomas Yuen*
