# Development Progress

## Current milestone

Milestone 1: Project skeleton.

## Completed

- Initialized pnpm workspace and Turborepo configuration.
- Added Next.js web console and NestJS API with `/health` and Swagger.
- Added worker, trap receiver, and probe ingest health services.
- Added shared, database, RouterOS adapter, SNMP adapter, and DNS adapter packages.
- Added PostgreSQL, Redis, and VictoriaMetrics Docker Compose services.
- Added lint, typecheck, test, build, CI, environment example, and base documentation.

## Database changes

- Added initial Prisma schema with `PlatformSetting`.

## API changes

- Added `GET /health`.
- Added Swagger UI at `/docs`.

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

- Add Dockerfiles and run the full Milestone 1 stack on a Docker-enabled host.
