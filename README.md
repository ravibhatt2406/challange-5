# EventCraft AI

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-00c853?style=for-the-badge&logo=render)](https://eventcraft-ai-nwwd.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![Tests](https://img.shields.io/badge/Tests-75%20Passed-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)

> **GenAI-powered event planning assistant** for weddings, birthdays, anniversaries, and community gatherings. Features schema-backed budgets, an interactive 3D Timeline Highway, vendor coordination, a creative ideas studio, and a stage-and-confirm AI Copilot.

---

## 🌐 Live Application

- **Production URL:** [https://eventcraft-ai-nwwd.onrender.com](https://eventcraft-ai-nwwd.onrender.com)
- **Deployment Platform:** Render (Unified Full-Stack Node.js Service)
- **Status:** Active & Operational

---

## ✨ Key Capabilities & Highlights

1. **Intelligent Event Wizard (5 Steps)**
   - Guided brief capturing event type, target headcount, dates, budget bounds, and stylistic themes.
   - Live validation via shared Zod schemas before persistence.

2. **Full-Featured Planning Workspaces**
   - **Interactive 3D Donut Budget Visualizer:** Real-time breakdown of estimated vs. actual expenses with over-budget alerts.
   - **3D Timeline Highway:** Multi-view timeline supporting **3D Highway**, **Milestones**, and **Run-of-Show** urgency clustering (Overdue, Due This Week, Upcoming, Completed).
   - **Vendor Directory:** Category-based vendor pipeline with contact tracking and booking stages.
   - **Curated Ideas Studio:** Theme-tailored aesthetic suggestions with quick voting and status management.

3. **Multi-Model Generative AI & Copilot**
   - **Full Plan Generation:** Produces cohesive, categorized budgets, time-sequenced milestones, vendor checklists, and bespoke ideas in a single generation.
   - **Interactive AI Copilot:** Context-aware conversational assistant capable of proposing concrete modifications (e.g., adding budget lines, reallocating funds).
   - **Safety First (Stage & Confirm):** Copilot proposals are staged server-side and require user confirmation before committing to workspaces.
   - **AI Providers:** Native support for Google Gemini 2.5 Flash, self-hosted Ollama/LM Studio models, and a built-in deterministic offline mode.

4. **Robust Dual-Database Architecture**
   - **Zero-Credential Local SQLite:** Uses Node's native `node:sqlite` for immediate out-of-the-box local operation.
   - **Production PostgreSQL via Supabase:** Enterprise-grade cloud persistence with Row-Level Security and complete migration history.

---

## 🏛️ System Architecture

EventCraft AI follows a **modular-monolith** pattern:

```text
src/
├── client/                     # React 18 Frontend (Vite SPA)
│   ├── features/
│   │   ├── assistant/          # Real-time AI Copilot & Staged Proposals
│   │   ├── dashboard/          # Event list and active planning pulse
│   │   ├── events/             # Multi-step Event Creation Wizard & Details
│   │   ├── ideas/              # Ideas Studio with status boards
│   │   ├── landing/            # Interactive Hero & 3D Cards
│   │   └── planning/           # Budget, 3D Timeline Highway & Vendors
│   ├── shared/                 # UI Primitives, 3D Canvas, Confetti, API Client
│   └── styles/                 # Global styles and Tailwind utility rules
├── server/                     # Node.js + Express 5 Backend
│   ├── ai/                     # Gemini SDK, Ollama/LM Studio adapter, Plan Store
│   ├── db/                     # Supabase client & native SQLite adapter
│   ├── middleware/             # Auth, validation, rate limiting, error handler
│   ├── routes/                 # Event, planning, AI, and ideas REST endpoints
│   ├── services/               # Core business logic and persistence mapping
│   └── utils/                  # Budget math, UUID validation helpers
└── shared/                     # Single source of truth (TypeScript types & Zod schemas)
    ├── constants/              # Status enums, default configurations
    ├── schemas/                # Zod schemas shared by both client and server
    └── types/                  # Inferred domain types
```

---

## 🚀 Quickstart — Local Development

### Prerequisites
- **Node.js** 24+ (tested with v24.11; required for built-in `node:sqlite`)
- **npm** 10+
- *(Optional)* [Google Gemini API Key](https://aistudio.google.com/apikey)

### 1. Clone & Install
```bash
git clone https://github.com/ekjot9105-commits/EVENTCRAFT-AI.git
cd EVENTCRAFT-AI
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(The local SQLite mode and local deterministic AI work instantly without any keys. To use live Gemini, add `AI_PROVIDER=gemini` and your `GEMINI_API_KEY`).*

### 3. Launch Development Server
```bash
npm run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 📦 Production Deployment

The application is deployed to **Render** as a single unified service where the Express backend serves the compiled Vite client assets:

```bash
# 1. Build client and server bundles
npm run build

# 2. Launch production server
npm run server:start
```

For complete deployment instructions, environment setup, and Supabase database migration steps, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 🛡️ Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Runs both client (Vite) and server (Express) concurrently |
| `npm run dev:client` | Runs client Vite dev server only |
| `npm run dev:server` | Runs server with hot reload (`tsx watch`) |
| `npm run build` | Compiles client and server for production |
| `npm run server:start` | Runs the compiled production Express server |
| `npm test` | Runs the Vitest test suite (59 unit tests) |
| `npm run test:coverage` | Generates code coverage report |
| `npm run lint` | Runs ESLint across client, server, and test code |
| `npm run type-check` | Runs TypeScript compiler type checks (`tsc --noEmit`) |
| `npm run verify` | Full verification pipeline (Typecheck + Lint + Tests + Build) |

---

## 🧪 Testing & Code Quality

EventCraft AI maintains strict engineering standards:
- **Zero Lint Warnings:** Verified with ESLint 10.
- **Strict TypeScript:** Strict null checks, no unchecked index access, explicit boundary typing.
- **100% Test Pass Rate:** 75 tests across 12 test suites (59 unit tests + 16 full Express HTTP integration tests).
- **Anonymous Tenant Isolation:** Cookie and header session management (`ec_anon_id`) ensures zero multi-user collision in public demo environments.
- **Accessible Visualizations:** Screen-reader accessible data tables and keyboard rotation support for 3D canvas charts.

```bash
npm run verify
```

---

## 📚 Technical Documentation

- [Architecture & Boundaries](docs/ARCHITECTURE.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Engineering Conventions](docs/ENGINEERING_CONVENTIONS.md)
- [Problem Statement & Feature Alignment](docs/PROBLEM_STATEMENT_ALIGNMENT.md)
- [Final Submission Report](docs/FINAL_SUBMISSION_REPORT.md)

---

## 📄 License

This project is licensed under the ISC License.
