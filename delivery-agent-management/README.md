# Delivery Agent Management System

A clean, production-quality REST API + React frontend for managing delivery agents, built with Node.js, PostgreSQL, Redis, and Prisma.

---

## Overview & Tech Stack

| Layer      | Choice                   | Why                                                                       |
|------------|--------------------------|---------------------------------------------------------------------------|
| Backend    | Node.js + Express (TypeScript) | Simple, universally understood, minimal ceremony                    |
| Validation | Zod                      | Short, precise error messages; coercion built-in                          |
| Database   | PostgreSQL 16 + Prisma   | Relational model, ACID guarantees, unique constraints, free migrations    |
| Cache      | Redis 7 (ioredis)        | Fast in-memory cache-aside with version-based list invalidation           |
| Frontend   | React 19 + Vite          | Fast HMR, instant TypeScript, proxies API calls transparently             |
| Tests      | Vitest + Supertest        | Integration tests covering CRUD, error cases, and cache behaviour         |
| Infra      | Docker Compose           | One command gets Postgres + Redis running locally                         |

### Why PostgreSQL?

PostgreSQL was chosen because agents have a well-defined relational structure (fixed fields, typed enums) that maps naturally to a relational schema. The `email` and `phone` columns carry database-level `UNIQUE` constraints, making duplicate detection reliable and atomic even under concurrent inserts. PostgreSQL's ACID guarantees ensure that create/update/delete operations are fully consistent — a failed update never leaves the database in a partial state.

---

## Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Postgres + Redis)
- npm ≥ 9

---

## Setup (under 5 minutes)

### 1. Start infrastructure
```bash
docker compose up -d
```
This starts Postgres on port 5432 and Redis on port 6379.

### 2. Backend setup
```bash
cd backend
cp .env.example .env          # uses defaults that match docker-compose
npm install
npx prisma migrate dev --name init   # creates the agents table
npx prisma db seed                   # seeds 10 sample agents
npm run dev                          # starts on http://localhost:3001
```

### 3. Frontend setup (new terminal)
```bash
cd frontend
npm install
npm run dev                          # starts on http://localhost:5173
```

Open **http://localhost:5173** — the frontend proxies all `/api` calls to the backend automatically.

---

## Environment Variables

All variables are in `backend/.env.example`. Copy to `.env` before running.

| Variable        | Purpose                                    | Example value                                           |
|-----------------|--------------------------------------------|---------------------------------------------------------|
| `NODE_ENV`      | Runtime mode                               | `development`                                           |
| `PORT`          | Backend HTTP port                          | `3001`                                                  |
| `DATABASE_URL`  | Prisma PostgreSQL connection string        | `postgresql://dam_user:dam_password@localhost:5432/dam_db` |
| `REDIS_URL`     | ioredis connection string                  | `redis://localhost:6379`                               |
| `FRONTEND_URL`  | Allowed CORS origin                        | `http://localhost:5173`                                 |

---

## API Endpoint Reference

Base URL: `http://localhost:3001`

| Method | Endpoint              | Success         | Error codes          |
|--------|-----------------------|-----------------|----------------------|
| GET    | `/health`             | 200             | —                    |
| GET    | `/api/agents`         | 200 + `{data, meta}` | 400 bad query  |
| POST   | `/api/agents`         | 201 + agent     | 400 invalid, 409 duplicate |
| GET    | `/api/agents/:id`     | 200 + agent     | 400 bad UUID, 404    |
| PATCH  | `/api/agents/:id`     | 200 + agent     | 400, 404, 409        |
| DELETE | `/api/agents/:id`     | 204             | 400, 404             |

### Query parameters for `GET /api/agents`

| Param    | Type    | Default | Description                            |
|----------|---------|---------|----------------------------------------|
| `page`   | integer | 1       | Page number (1-indexed)                |
| `limit`  | integer | 10      | Items per page (max 100)               |
| `status` | string  | —       | Filter: `ACTIVE` or `INACTIVE`         |
| `q`      | string  | —       | Search fullName or serviceArea         |

### Consistent error shape

Every error response uses the same shape:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is invalid",
    "details": [{ "field": "email", "message": "Email is invalid" }]
  }
}
```

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`.

---

## Redis Caching

The API uses a **cache-aside** pattern with `ioredis`.

| What          | Key pattern                              | TTL     |
|---------------|------------------------------------------|---------|
| Single agent  | `agent:{id}`                             | 5 min   |
| Agent list    | `agents:list:v{version}:{queryHash}`     | 60 sec  |
| List version  | `agents:list:version`                    | forever |

### Invalidation strategy

Instead of scanning keys, a monotonic **version counter** is stored in Redis. Every write operation (create/update/delete) increments the counter via `INCR`. All list cache keys embed the current version, so incrementing the counter makes every old list key unreachable — they expire naturally via TTL.

- **Create**: bump list version
- **Update**: `DEL agent:{id}` + bump list version
- **Delete**: `DEL agent:{id}` + bump list version

### Observability

Every response includes `X-Cache: HIT` or `X-Cache: MISS` so you can verify caching with:
```bash
curl -i http://localhost:3001/api/agents/SOME_ID | grep x-cache
# First call:  x-cache: MISS
# Second call: x-cache: HIT
```

### Redis resilience

If Redis is down, all cache operations are silently skipped and the API falls back to PostgreSQL. Redis availability never affects API availability.

---

## How to Run Tests

Tests require Docker Compose to be running (they use the real database).

```bash
cd backend
npm test               # run all tests once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

Tests cover:
- ✅ Full CRUD lifecycle (create → get → list → update → delete)
- ✅ Validation errors (400) — missing fields, invalid email, invalid UUID
- ✅ Not-found errors (404)
- ✅ Conflict errors (409) — duplicate email and phone
- ✅ Cache behaviour — `X-Cache: MISS` on first GET, `HIT` on second, `MISS` after PATCH

---

## Manual Testing

A `requests.http` file is included at the project root for use with the [VS Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension.

---

## Project Structure

```
delivery-agent-management/
├── backend/
│   ├── src/
│   │   ├── routes/        # route definitions
│   │   ├── controllers/   # request/response handling
│   │   ├── services/      # business logic (DB + cache)
│   │   ├── cache/         # Redis client + cache helpers
│   │   ├── middleware/     # validate, errorHandler
│   │   ├── schemas/        # Zod schemas
│   │   └── app.ts, server.ts
│   ├── prisma/             # schema.prisma, seed.ts
│   ├── tests/              # Vitest + Supertest tests
│   └── .env.example
├── frontend/               # React 19 + Vite
│   └── src/
│       ├── api/            # Axios client
│       └── components/     # AgentFormModal, AgentDetailModal, etc.
├── docker-compose.yml
├── requests.http           # manual test file
└── README.md
```
