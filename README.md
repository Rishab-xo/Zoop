# Delivery Agent Management System (Zoop)

A clean, production-ready full-stack REST API and React web application for managing delivery agents, built with **Node.js (TypeScript)**, **PostgreSQL 16**, **Redis 7**, **Prisma ORM**, and **React 19 (Vite)**.

[![Tests](https://img.shields.io/badge/tests-26%20passed-brightgreen.svg)](#how-to-run-tests)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-blue.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-7-red.svg)](https://redis.io/)

---

## Repository Structure

```
Zoop/
└── delivery-agent-management/
    ├── backend/              # Node.js + Express + TypeScript + Prisma + Redis
    │   ├── src/
    │   │   ├── controllers/  # Request handling & cache headers
    │   │   ├── services/     # Business logic & database operations
    │   │   ├── cache/        # Redis cache-aside client & helpers
    │   │   ├── routes/       # Express route declarations
    │   │   ├── middleware/   # Zod validation & global error handler
    │   │   └── schemas/      # Zod validation schemas
    │   ├── prisma/           # schema.prisma, migrations, seed.ts
    │   ├── tests/            # Vitest + Supertest integration test suite
    │   └── .env.example      # Backend environment variables
    ├── frontend/             # React 19 + TypeScript + Vite
    │   ├── src/
    │   │   ├── components/   # Modals (create/edit, detail, delete), Toasts
    │   │   ├── api/          # Axios client & type definitions
    │   │   └── utils/        # Formatters (phone, date)
    │   └── .env.example      # Frontend environment variables
    ├── docker-compose.yml    # One-click Postgres + Redis infrastructure
    ├── requests.http         # Manual REST test suite (VS Code REST Client)
    └── README.md             # Sub-folder documentation
```

---

## Overview & Architecture

| Layer | Technology | Key Decisions & Benefits |
|---|---|---|
| **Backend** | Node.js + Express (TypeScript) | Explicit layering (Route → Controller → Service → DB/Cache), strongly typed. |
| **Validation** | Zod | Request body, query param coercion (`page`, `limit`), and UUID param validation. |
| **Database** | PostgreSQL 16 + Prisma ORM | Relational data integrity, unique constraints (`email`, `phone`), automated migrations. |
| **Cache** | Redis 7 (`ioredis`) | Cache-aside pattern with version-based list invalidation (no expensive scans). |
| **Frontend** | React 19 + Vite | Fast HMR, dark UI, client-side validation, live search, status filters, statistics. |
| **Tests** | Vitest + Supertest | 26 automated integration tests covering full CRUD, edge cases, and caching. |
| **Infra** | Docker Compose | One-command local setup for PostgreSQL and Redis. |

### Why PostgreSQL?

PostgreSQL provides strict schema definitions with typed enums (`AgentStatus: ACTIVE | INACTIVE`) and ACID transaction guarantees. Crucially, the `email` and `phone` columns have database-level `UNIQUE` constraints that prevent race conditions and duplicate agents even under high concurrency.

---

## Quickstart (Under 5 Minutes)

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- npm ≥ 9

### 1. Start Infrastructure (PostgreSQL & Redis)

From the project root:
```bash
cd delivery-agent-management
docker compose up -d
```
*Starts PostgreSQL on port `5432` and Redis on port `6379`.*

### 2. Backend Setup

In terminal 1:
```bash
cd delivery-agent-management/backend
cp .env.example .env                  # Default credentials match docker-compose
npm install
npx prisma migrate dev --name init   # Applies migrations to Postgres
npx prisma db seed                   # Seeds 10 realistic sample agents
npm run dev                          # Starts server on http://localhost:3001
```

### 3. Frontend Setup

In terminal 2:
```bash
cd delivery-agent-management/frontend
npm install
npm run dev                          # Starts Vite on http://localhost:5173
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser. The Vite dev server proxies `/api` calls directly to `http://localhost:3001`.

---

## Environment Variables

### Backend (`delivery-agent-management/backend/.env.example`)

| Variable | Description | Default / Example Value |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | HTTP server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://dam_user:dam_password@localhost:5432/dam_db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `FRONTEND_URL` | CORS origin allowance | `http://localhost:5173` |

### Frontend (`delivery-agent-management/frontend/.env.example`)

| Variable | Description | Default / Example Value |
|---|---|---|
| `VITE_API_URL` | Remote API base URL (optional) | Defaults to `/api` (Vite reverse proxy) |

> 🔒 **Security Notice**: Actual `.env` files are ignored by Git (`.gitignore`) to avoid committing secrets.

---

## Redis Caching Strategy

The backend implements the **cache-aside** pattern with `ioredis`:

| Entity | Key Pattern | TTL | Strategy |
|---|---|---|---|
| **Single Agent** | `agent:{id}` | 5 minutes | Direct lookup by UUID |
| **Agent Lists** | `agents:list:v{version}:{normalizedQuery}` | 60 seconds | Version-tagged query hash |
| **List Version** | `agents:list:version` | Persistent | Incremented monotonic counter |

### Invalidation Strategy

To invalidate filtered/paginated lists without executing expensive and blocking Redis `KEYS` or `SCAN` operations:
1. A monotonic version counter is stored in `agents:list:version`.
2. Every list cache key embeds this version: `agents:list:v{version}:{queryHash}`.
3. When any write occurs (**create**, **update**, or **delete**):
   - The version counter is incremented via atomic `INCR`.
   - All previous list entries become immediately unreachable and expire via their 60-second TTL.
   - For **update** and **delete**, the specific single-agent key `agent:{id}` is also deleted immediately (`DEL`).

### Observability & Headers

Every response returning an agent or list exposes an `X-Cache` header:
- `X-Cache: HIT` — Data served directly from Redis.
- `X-Cache: MISS` — Data fetched from PostgreSQL and populated into Redis.

### Resilience (Fault Tolerance)

If Redis encounters an outage or becomes unreachable:
- Redis commands are safely wrapped (`safeGet`, `safeSet`, `safeDel`, `safeIncr`).
- Failures are logged without throwing unhandled exceptions.
- The application automatically falls back to PostgreSQL, ensuring 100% API availability even when Redis is down.

---

## API Reference

Base URL: `http://localhost:3001`

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/health` | Health check endpoint | `200` |
| `GET` | `/api/agents` | List agents (pagination, filters, search) | `200`, `400` |
| `POST` | `/api/agents` | Create a new delivery agent | `201`, `400`, `409` |
| `GET` | `/api/agents/:id` | Retrieve an agent by UUID | `200`, `400`, `404` |
| `PATCH` | `/api/agents/:id` | Update an existing agent's details | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/agents/:id` | Delete an agent by UUID | `204`, `400`, `404` |

### Query Parameters for `GET /api/agents`

- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `10`, max: `100`)
- `status`: Filter by status (`ACTIVE` or `INACTIVE`)
- `q`: Search query matching `fullName`, `serviceArea`, `email`, or `phone` (case-insensitive)

### Standardized Error Format

All errors return a predictable JSON payload:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is invalid",
    "details": [
      {
        "field": "email",
        "message": "Email is invalid"
      }
    ]
  }
}
```

Standard error codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_SERVER_ERROR` (500).

---

## How to Run Tests

### 1. Automated Integration Tests (Vitest + Supertest)

Ensure PostgreSQL is running (`docker compose up -d`), then execute:

```bash
cd delivery-agent-management/backend
npm test
```

To run with coverage:
```bash
npm run test:coverage
```

**26 test cases cover:**
- ✅ Complete CRUD lifecycle (Create → Read → List → Update → Delete)
- ✅ Input validation & edge cases (missing fields, malformed phone/email, invalid UUID)
- ✅ Conflict handling (duplicate email or phone rejected with 409)
- ✅ Redis cache behaviour (`MISS` on first fetch, `HIT` on repeated fetch, `MISS` after mutation)
- ✅ Graceful fallback when Redis is unavailable

### 2. Manual Testing with `requests.http`

Open `delivery-agent-management/requests.http` inside VS Code with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension to execute pre-configured HTTP requests for all positive and negative test cases.

---

## Summary of Checklist & Evaluation Criteria

| Requirement | Implementation Details |
|---|---|
| **Git Repository** | Hosted at `https://github.com/Rishab-xo/Zoop.git`, clean branch structure. |
| **README & Setup** | Comprehensive top-level and directory-level READMEs with copy-paste commands. |
| **Environment Variables** | Complete `.env.example` templates for both backend and frontend; secrets uncommitted. |
| **Database & Migrations** | PostgreSQL + Prisma migrations tracked in Git, idempotent seeding script (`seed.ts`). |
| **Redis Caching** | Cache-aside, atomic monotonic list versioning, TTLs, `X-Cache` headers, fallback on failure. |
| **CRUD & Completeness** | Full create, read, update, delete for agents with search, filters, and pagination. |
| **API Design & Errors** | REST conventions, Zod validation schemas, consistent error structures, standard HTTP status codes. |
| **Frontend Usability** | React 19 UI with responsive layout, debounced search, modal forms, status chips, and toast alerts. |
| **Maintainability** | TypeScript throughout, clean separation of concerns, zero linter warnings. |
