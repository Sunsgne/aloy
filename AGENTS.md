# Aloy Development Rules

Before a task, read `docs/AI_CONTEXT.md`, `docs/DEVELOPMENT_PROGRESS.md`, and the
files directly related to the task.

- Work on one vertical capability at a time.
- Keep controllers free of business logic and direct Prisma access.
- Access RouterOS, SNMP, and DNS systems only through adapters.
- Keep tenant isolation at both service and database boundaries.
- Update `docs/DEVELOPMENT_PROGRESS.md` after every completed task.
- Run lint, typecheck, tests, build, and `docker compose config` before finishing.

