# Aloy

Aloy is a multi-tenant RouterOS SD-WAN, intelligent DNS, device management, and
unified monitoring platform.

## Requirements

- Node.js 20 or newer
- pnpm 10
- Docker with Docker Compose

## Start development

```bash
cp .env.example .env
pnpm install
pnpm db:generate
docker compose up -d
pnpm dev
```

The web console runs at `http://localhost:3000`; the API health endpoint runs at
`http://localhost:3001/health`, and Swagger UI is available at
`http://localhost:3001/docs`.

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config
```

