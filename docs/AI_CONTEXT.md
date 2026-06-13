# AI Context

## Product

Aloy is a RouterOS-focused multi-tenant SD-WAN operations platform. It compiles
business intent into reviewed RouterOS configuration and unifies device,
routing, DNS, SNMP, link-quality, alerting, and SLA workflows.

## Architecture

- TypeScript pnpm/Turborepo monorepo.
- Next.js web console.
- NestJS modular-monolith API.
- Independent worker, trap receiver, and probe ingest processes.
- PostgreSQL for business data, Redis for queues/cache/locks, and
  VictoriaMetrics for time-series metrics.
- RouterOS, SNMP, and DNS integrations are adapter-only.

## Current milestone

Milestone 2: implement multi-tenancy, authentication, RBAC, auditing, and
subscription quota management.
