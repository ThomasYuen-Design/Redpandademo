# Architecture & Design Decisions

## 1. State Management Strategy
**Decision:** Decoupled data generation and logic from the view layer.
**Rationale:** The original prototype mixed data generation (`generateMockData`) directly within the view components (`App.jsx`). This made it difficult to test and reason about data flow. 
**Implementation:** 
- Created `useAgentPipeline` hook to manage the "living" state of agents and traces.
- This creates a clear boundary: The View consumes data; the Hook manages data consistency.

## 2. Design System (Atomic Design)
**Decision:** Implemented a strict UI primitive layer.
**Rationale:** To scale a frontend team, developers must stop reinventing the wheel (e.g., inline Tailwind classes for every badge).
**Implementation:**
- `src/components/ui/Badge`: Standardized statuses (Healthy, Failed, etc.).
- `src/components/ui/Card`: Unified container styling.
- `src/components/ui/DataTable`: Reusable table wrapper for data-dense views.

## 3. Separation of Concerns (Feature-Based Architecture)
**Decision:** Adopted a feature-based directory structure (`src/features/dashboard`).
**Rationale:** Grouping by "type" (components, hooks) is fine for small apps, but grouping by "feature" (Dashboard, Stream) scales better as the app grows. 
**Implementation:**
- `DashboardHeader`, `PipelinesTable`, and `AgentDashboard` are co-located in `src/features/dashboard`.
- Global shared components live in `src/components/ui`.

## 4. Type Safety
**Decision:** Strict TypeScript interfaces for the Domain Model.
**Rationale:** "Stringly typed" code (passing generic objects) is the root cause of runtime errors in data pipelines.
**Implementation:**
- Defined `AgentConfig`, `Trace`, `Span` in `src/types/index.ts`.
- This ensures that if the backend (or mock generator) changes a field, the frontend build fails immediately, rather than showing a blank screen to the user.
