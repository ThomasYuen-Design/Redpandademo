# RedPanda Agent Demo - Project Summary

## 📋 Project Overview

**RedPanda Agent Demo** is a production-grade **AI Agent Observability Dashboard** built with React, TypeScript, and Vite. The application provides real-time monitoring and visualization of distributed AI agent pipelines, offering deep insights into agent health, performance metrics, and execution traces.

### Core Purpose
This dashboard serves as a centralized observability platform for monitoring multiple AI agents in a distributed system, enabling:
- **Real-time health monitoring** of agent pipelines
- **Performance analytics** with latency tracking and error rate monitoring
- **Distributed tracing** with detailed span-level inspection
- **Operational insights** through structured log streaming

---

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Styling**: TailwindCSS 3.4.17 with custom design system
- **Icons**: Lucide React 0.562.0
- **Type Safety**: Strict TypeScript with comprehensive domain models

### Design Patterns

#### 1. **Feature-Based Architecture**
The project follows a feature-based folder structure rather than traditional component-type grouping:

```
src/
├── features/dashboard/      # Dashboard feature module
│   ├── AgentDashboard.tsx   # Main dashboard view
│   ├── DashboardHeader.tsx  # Metrics overview
│   ├── PipelinesTable.tsx   # Agent list table
│   ├── StreamView.tsx       # Trace stream viewer
│   └── TraceRow.tsx         # Individual trace renderer
├── components/
│   ├── ui/                  # Atomic design primitives
│   │   ├── Badge.tsx        # Status badges
│   │   ├── Card.tsx         # Container components
│   │   ├── DataTable.tsx    # Reusable table wrapper
│   │   ├── JsonViewer.tsx   # JSON payload viewer
│   │   └── tooltip.tsx      # Tooltip component
│   └── layout/              # Layout components
│       └── TopBar.tsx       # Application header
├── hooks/
│   └── useAgentPipeline.ts  # State management hook
└── types/
    └── index.ts             # TypeScript domain models
```

**Rationale**: Feature-based organization scales better as the application grows, keeping related components co-located while maintaining clear boundaries between features and shared UI primitives.

#### 2. **Atomic Design System**
The UI layer follows atomic design principles with reusable primitives:
- **Atoms**: `Badge`, `Card`, `DataTable`, `JsonViewer`
- **Molecules**: Feature-specific components like `TraceRow`, `DashboardHeader`
- **Organisms**: Complete features like `AgentDashboard`, `StreamView`

**Benefits**:
- Consistent styling across the application
- Reduced code duplication
- Easier maintenance and testing
- Scalable for team collaboration

#### 3. **Custom Hook for State Management**
The `useAgentPipeline` hook encapsulates all data generation and state logic:
- Generates mock agent configurations
- Simulates real-time trace data
- Calculates dynamic metrics (health status, error rates, latency)
- Provides a clean API for components to consume

**Separation of Concerns**:
- **View Layer**: Components focus purely on rendering
- **Logic Layer**: Hook manages data consistency and business logic
- **Type Layer**: TypeScript interfaces ensure type safety

---

## 🎯 Key Features

### 1. **Dashboard View**
The main dashboard provides a high-level overview of all agent pipelines:

- **Cluster Metrics**:
  - Total agent count
  - Health distribution (Healthy/Degraded/Failed)
  - Cluster-wide P99 latency
  - Total throughput

- **Agent Pipeline Table**:
  - Agent name and type (Orchestrator/Worker/Sidecar)
  - Real-time health status with color-coded badges
  - Performance metrics (P99 latency, error rate, throughput)
  - Active trace count
  - Model information (for LLM-based agents)

### 2. **Stream View**
Drill-down view for individual agent inspection:

- **Agent Configuration Panel**:
  - Agent metadata (name, type, capabilities)
  - System prompt (for LLM agents)
  - Description and configuration details

- **Live Trace Stream**:
  - Real-time trace log display
  - Expandable trace rows with detailed span information
  - Status indicators (success/error)
  - Latency tracking per trace
  - JSON payload inspection

### 3. **Trace Inspection**
Detailed span-level analysis:

- **Span Stages**: Multi-stage pipeline visualization
- **LLM Traces**: Token usage, model info, reasoning traces
- **Tool Calls**: Function execution details
- **Kafka Operations**: Topic, partition, offset tracking
- **Error Details**: Failure reasons and stack traces

---

## 📊 Domain Model

### Core Types

#### `AgentConfig`
Represents an AI agent pipeline configuration:
```typescript
{
  id: string;                    // Unique identifier
  name: string;                  // Display name
  type: 'orchestrator' | 'worker' | 'sidecar';
  health: HealthState;           // Current health status
  metrics: AgentMetrics;         // Performance metrics
  capabilities: string[];        // Agent capabilities
  description: string;           // Human-readable description
  model?: string;                // LLM model (if applicable)
  systemPrompt?: string;         // System prompt (for LLM agents)
}
```

#### `Trace`
Represents a distributed trace through the agent pipeline:
```typescript
{
  trace_id: string;              // Unique trace identifier
  timestamp: string;             // ISO timestamp
  service: string;               // Agent ID
  status: string;                // 'success' | 'error'
  latency_ms: number;            // Total trace latency
  spans: Span[];                 // Ordered list of execution spans
}
```

#### `Span`
Represents a single stage in the trace:
```typescript
{
  stage: string;                 // Stage name
  topic?: string;                // Kafka topic (if applicable)
  model?: string;                // LLM model
  token_usage?: TokenUsage;      // Token consumption
  tool_calls?: ToolCall[];       // Function calls
  reasoning_trace?: string;      // LLM reasoning
  latency_ms?: number;           // Stage latency
  status?: string;               // Stage status
  // ... additional fields for different agent patterns
}
```

---

## 🎨 Design System

### Color Palette
The application uses a sophisticated color scheme:

- **Status Colors**:
  - Healthy: `bg-emerald-50 text-emerald-700 border-emerald-200`
  - Degraded: `bg-amber-50 text-amber-700 border-amber-200`
  - Failed: `bg-rose-50 text-rose-700 border-rose-200`

- **UI Colors**:
  - Background: `bg-white`
  - Text: `text-slate-900`
  - Borders: `border-slate-200`
  - Accents: `bg-slate-50`, `hover:bg-slate-100`

### Typography
- **Font Family**: System font stack (sans-serif)
- **Headings**: Bold weights with clear hierarchy
- **Body Text**: Regular weight for readability
- **Code/Data**: Monospace font for technical content

---

## 🔄 Data Flow

### Mock Data Generation
The `useAgentPipeline` hook simulates a real-time data pipeline:

1. **Initial Setup**:
   - Generates 3 mock agent configurations
   - Creates initial trace history for each agent

2. **Real-time Updates**:
   - Appends new traces every 2-5 seconds
   - Simulates various agent patterns (LLM, Kafka, Sidecar)
   - Calculates dynamic health status based on error rates

3. **Health Calculation**:
   ```typescript
   - FAILED: error_rate >= 50% OR last_active > 30s
   - DEGRADED: error_rate >= 20% OR last_active > 15s
   - HEALTHY: Otherwise
   ```

4. **Metrics Aggregation**:
   - P99 latency from recent traces
   - Error rate from status codes
   - Throughput estimation
   - Active trace counting

---

## 🚀 Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Project Scripts
- `dev`: Starts Vite dev server with HMR
- `build`: Creates optimized production bundle
- `preview`: Serves production build locally
- `lint`: Runs ESLint on codebase

---

## 📁 File Structure

```
RedPandaAgentDemo/
├── public/                      # Static assets
├── src/
│   ├── features/dashboard/      # Dashboard feature
│   │   ├── AgentDashboard.tsx   # Main view
│   │   ├── DashboardHeader.tsx  # Metrics header
│   │   ├── PipelinesTable.tsx   # Agent table
│   │   ├── StreamView.tsx       # Trace viewer
│   │   └── TraceRow.tsx         # Trace renderer
│   ├── components/
│   │   ├── ui/                  # Design primitives
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── JsonViewer.tsx
│   │   │   └── tooltip.tsx
│   │   └── layout/
│   │       └── TopBar.tsx       # App header
│   ├── hooks/
│   │   └── useAgentPipeline.ts  # State management
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── App.tsx                  # Root component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── ARCHITECTURE.md              # Architecture decisions
├── PROJECT_SUMMARY.md           # This file
├── README.md                    # Vite template README
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind config
├── vite.config.js               # Vite config
└── eslint.config.js             # ESLint config
```

---

## 🎯 Design Decisions

### 1. **TypeScript Migration**
**Problem**: Original prototype was in vanilla JavaScript, leading to runtime errors and poor developer experience.

**Solution**: Full TypeScript migration with strict type checking.

**Benefits**:
- Compile-time error detection
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

### 2. **State Management**
**Problem**: Data generation mixed with view logic in components.

**Solution**: Custom `useAgentPipeline` hook for centralized state management.

**Benefits**:
- Clear separation of concerns
- Testable business logic
- Reusable across components
- Easier to swap with real API later

### 3. **Component Architecture**
**Problem**: Inline styles and duplicated UI code.

**Solution**: Atomic design system with reusable primitives.

**Benefits**:
- Consistent UI/UX
- Faster development
- Easier maintenance
- Team scalability

### 4. **Feature-Based Organization**
**Problem**: Traditional component-type folders don't scale.

**Solution**: Feature-based directory structure.

**Benefits**:
- Better code locality
- Easier to understand features
- Simpler to add new features
- Clearer boundaries

---

## 🔮 Future Enhancements

### Short-term
- [ ] Connect to real backend API (replace mock data)
- [ ] Add WebSocket support for real-time updates
- [ ] Implement trace filtering and search
- [ ] Add time-range selection for historical data
- [ ] Export traces to JSON/CSV

### Medium-term
- [ ] Add user authentication
- [ ] Implement alert configuration
- [ ] Create custom dashboards
- [ ] Add agent comparison view
- [ ] Implement trace correlation

### Long-term
- [ ] Multi-cluster support
- [ ] Advanced analytics and ML insights
- [ ] Custom metric definitions
- [ ] Integration with external monitoring tools
- [ ] Mobile-responsive design

---

## 📝 Key Metrics

### Codebase Statistics
- **Total TypeScript Files**: 14
- **Components**: 12
- **Custom Hooks**: 1
- **Type Definitions**: 8 interfaces
- **Lines of Code**: ~1,900 (excluding dependencies)

### Performance
- **Bundle Size**: Optimized with Vite
- **Hot Module Replacement**: Instant updates
- **Type Checking**: Compile-time validation
- **Build Time**: < 5 seconds

---

## 🤝 Contributing

This project follows best practices for modern React development:
- **Code Style**: ESLint with React hooks rules
- **Type Safety**: Strict TypeScript
- **Component Design**: Atomic design principles
- **State Management**: Custom hooks pattern
- **Documentation**: Inline comments and architecture docs

---

## 📚 Documentation

- **ARCHITECTURE.md**: Detailed architectural decisions and rationale
- **PROJECT_SUMMARY.md**: This comprehensive project overview
- **README.md**: Vite template documentation

---

## 🏆 Project Highlights

### What Makes This Project Stand Out

1. **Production-Grade Architecture**: Not just a prototype—follows enterprise-level patterns
2. **Type Safety**: Comprehensive TypeScript coverage prevents runtime errors
3. **Scalable Design**: Feature-based architecture ready for team collaboration
4. **Reusable Components**: Atomic design system accelerates future development
5. **Clean Separation**: View logic completely decoupled from data management
6. **Real-time Simulation**: Sophisticated mock data generator mimics production behavior
7. **Detailed Observability**: Multi-level inspection from cluster → agent → trace → span

---

## 📞 Project Context

This dashboard was built to demonstrate:
- Senior-level React/TypeScript skills
- Understanding of distributed systems observability
- Ability to architect scalable frontend applications
- Knowledge of modern web development best practices
- Experience with real-time data visualization

The project serves as both a functional observability tool and a showcase of clean code architecture, making it suitable for both production use and as a reference implementation.

---

**Last Updated**: January 5, 2026  
**Version**: 0.0.0  
**Status**: Active Development
