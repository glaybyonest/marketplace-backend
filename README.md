# Marketplace Backend

Production-style backend for a marketplace application with JWT auth, catalog, favorites, places, and personalized recommendations.

## Tech Stack
- Go 1.24+
- PostgreSQL 16
- Chi router
- Pgx (database driver)
- Goose migrations
- Docker / Docker Compose
- Frontend: React + Vite (in `frontend/`)

## Repository Layout
- `cmd/api` - application entrypoint
- `internal/app` - app wiring and startup
- `internal/http` - handlers, middleware, DTO, response envelopes
- `internal/usecase` - business logic
- `internal/repository/postgres` - SQL repositories
- `internal/domain` - domain models and errors
- `migrations` - database schema and seed migrations
- `docker` - postgres init scripts
- `frontend` - React frontend integrated with this backend API
- `scripts` - local dev helper scripts

## Environment
Create `.env` from `.env.example` and set a secure `JWT_SECRET`.

Example values:
```env
APP_ENV=development
HTTP_PORT=8080
DATABASE_URL=postgres://postgres:postgres@postgres:5432/marketplace?sslmode=disable
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5433/marketplace_test?sslmode=disable
JWT_SECRET=replace_with_a_long_random_secret_of_at_least_32_chars
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=720h
LOG_LEVEL=info
```

## Run with Docker
1. Start services:
```bash
docker compose up -d --build
```
2. Check status:
```bash
docker compose ps
```
3. Health checks:
```bash
curl http://localhost:8080/healthz
curl http://localhost:8080/readyz
```
4. Stop services:
```bash
docker compose down -v
```

## Database Migrations
Run migrations from host:
```bash
go run github.com/pressly/goose/v3/cmd/goose@v3.26.0 -dir migrations postgres "postgres://postgres:postgres@localhost:5433/marketplace?sslmode=disable" up
```

Rollback one step:
```bash
go run github.com/pressly/goose/v3/cmd/goose@v3.26.0 -dir migrations postgres "postgres://postgres:postgres@localhost:5433/marketplace?sslmode=disable" down
```

Notes:
- `00003_db_hardening.sql` adds DB constraints and performance indexes.
- `00004_products_search_trgm.sql` adds optional `pg_trgm` index for faster `LIKE` search.

## Run Backend Locally (without Docker API container)
1. Start PostgreSQL only:
```bash
docker compose up -d postgres
```
2. Apply migrations.
3. Run API:
```bash
go run ./cmd/api
```

## Run Frontend Locally
```bash
cd frontend
npm install
```

Create frontend env from template and run:
```bash
npm run dev
```

Default frontend proxy target is `http://localhost:8080`.

## Tests and Checks
Backend:
```bash
go test ./...
```

Frontend:
```bash
cd frontend
npm run lint
npm run test
npm run build
```

## API Overview
Base URL: `http://localhost:8080`

Public:
- `GET /healthz`
- `GET /readyz`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/categories`
- `GET /api/v1/categories/slug/{slug}`
- `GET /api/v1/categories/{id}`
- `GET /api/v1/products`
- `GET /api/v1/products/slug/{slug}`
- `GET /api/v1/products/{id}`

Authenticated:
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `GET /api/v1/favorites`
- `POST /api/v1/favorites/{product_id}`
- `DELETE /api/v1/favorites/{product_id}`
- `POST /api/v1/places`
- `GET /api/v1/places`
- `PATCH /api/v1/places/{id}`
- `DELETE /api/v1/places/{id}`
- `GET /api/v1/recommendations`

## Useful Commands
From repo root:
- `powershell -ExecutionPolicy Bypass -File scripts/dev-backend.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/dev-frontend.ps1`
- `go test ./...`

## License
Internal project / educational use.
