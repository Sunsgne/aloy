# Development Progress

## Current milestone

Milestone 3: Device inventory and RouterOS initialization.

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
- Added tenant-scoped role management and a platform permission catalog, with
  validated permission assignment and audit events.
- Filtered soft-deleted roles from newly issued access tokens.
- Added subscription quota creation/current-plan lookup and tenant-scoped audit
  event queries, including explicit platform cross-tenant access reasons.
- Added tenant-scoped API token creation, safe listing, revocation, and audit
  events; plaintext secrets are returned only at creation and stored as hashes.
- Added an idempotent `db:seed` command for the Milestone 2 permission catalog.
- Replaced the web placeholder with a responsive Milestone 2 administration
  console covering overview, tenants, users and roles, subscriptions, API
  tokens, audit events, and service health.
- Added tenant-scoped Site, Device, BootstrapToken, OnboardingSession, and
  OnboardingStep models.
- Added site and device inventory APIs plus one-time bootstrap token issuance
  for CLEAN_BOOTSTRAP, ADOPT_EXISTING, MONITORING_ONLY, and POP_NODE modes.
- Added device inventory and RouterOS initialization center pages, alongside
  a visual-quality pass for navigation contrast, status surfaces, cards, and
  workflow presentation.
- Added an HTTPS-only RouterOS bootstrap script generator using `/tool fetch`,
  JSON serialization, certificate validation, and a one-time token.
- Added public device registration that atomically consumes bootstrap tokens,
  validates bound serial numbers, records identity, rotates device credentials,
  and starts onboarding.
- Added authenticated device heartbeat ingestion with timestamps, monotonic
  sequences for replay protection, identity refresh, and onboarding progress.
- Added management WireGuard plan generation without private key material,
  including strict validation, Aloy-managed tagging, and verification targets.
- Added ADOPT_EXISTING read-only configuration analysis that protects untagged
  objects, identifies high-risk conflicts, and limits takeover scope to
  explicitly Aloy-managed resources.

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
- Added `GET /api/v1/iam/permissions`.
- Added `GET/POST /api/v1/iam/roles`.
- Added `PATCH/DELETE /api/v1/iam/roles/:id`.
- Added `GET /api/v1/subscription` and `POST /api/v1/subscriptions`.
- Added `GET /api/v1/audit-events`.
- Added `GET/POST /api/v1/api-tokens`.
- Added `DELETE /api/v1/api-tokens/:id`.
- Added `GET/POST /api/v1/sites`.
- Added `GET/POST /api/v1/devices`.
- Added `POST /api/v1/devices/:id/bootstrap-tokens`.
- Added `GET /api/v1/devices/:id/bootstrap-script`.
- Added `POST /api/v1/device-onboarding/register`.
- Added `POST /api/v1/device-reports/heartbeat`.
- Added `GET /api/v1/onboarding-sessions/:id`.
- Added `POST /api/v1/onboarding-sessions/:id/management-wireguard-plan`.
- Added `POST /api/v1/onboarding-sessions/:id/adoption-preview`.
- Added `GET /api/v1/onboarding-sessions`.

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

- Add device identity, package, Device Mode, and capability discovery.
