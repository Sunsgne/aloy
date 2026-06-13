import { startHealthServer } from "@aloy/shared";

const port = Number(process.env.PROBE_INGEST_HEALTH_PORT ?? 3013);
startHealthServer("probe-ingest", port);
console.log(`probe ingest health check listening on ${port}`);

