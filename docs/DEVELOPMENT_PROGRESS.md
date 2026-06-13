# Development Progress

## Current milestone

Milestone 2: Multi-tenancy and permissions.

## Completed

- Initialized pnpm workspace and Turborepo configuration.
- Added Next.js web console and NestJS API with `/health` and Swagger.
- Added worker, trap receiver, and probe ingest health services.
- Added shared, database, RouterOS adapter, SNMP adapter, and DNS adapter packages.
- Added PostgreSQL, Redis, and VictoriaMetrics Docker Compose services.
- Added lint, typecheck, test, build, CI, environment example, and base documentation.
- Added identity and tenant Prisma models for Tenant, User, Role, Permission,
  Subscription, API tokens, and audit events.
- Added shared request context and mandatory tenant/platform access guards.
- Added password-based login and JWT access token issuance.
- Added hashed, rotating, revocable refresh tokens and logout.
- Added default JWT authentication guard and server-side permission guard.
- Added explicit public and required-permission route decorators.
- Added platform tenant management APIs with permission checks, cross-tenant
  access reasons, soft deletion, and transactional audit events.
- Added tenant-scoped user management with password hashing, same-tenant role
  assignment, token revocation, soft deletion, and audit events.

## Database changes

- Added initial Prisma schema with `PlatformSetting`.
- Added Milestone 2 identity, tenant, RBAC, subscription, API token, and audit
  entities.
- Added `RefreshToken` persistence with expiry and revocation state.

## API changes

- Added `GET /health`.
- Added Swagger UI at `/docs`.
- Added `POST /api/v1/auth/login`.
- Added `POST /api/v1/auth/refresh`.
- Added `POST /api/v1/auth/logout`.
- Added `GET/POST /api/v1/tenants`.
- Added `GET/PATCH/DELETE /api/v1/tenants/:id`.
- Added `GET/POST /api/v1/users`.
- Added `PATCH/DELETE /api/v1/users/:id`.

## Known issues

- Docker is not installed in the current environment, so `docker compose config`
  could not be executed.

## Verification

- `pnpm install`: passed.
- `pnpm db:generate`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed, including API and shared runtime unit tests.
- `pnpm build`: passed for all 10 workspace projects.
- Runtime smoke test: API, worker, trap receiver, and probe ingest `/health`
  endpoints returned `status: ok`.
- `docker compose config`: not run because Docker is unavailable.

## Next task

- Add role, permission, subscription, and audit query services and APIs.
