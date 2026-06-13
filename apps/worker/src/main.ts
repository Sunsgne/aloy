import { startHealthServer } from "@aloy/shared";

const port = Number(process.env.WORKER_HEALTH_PORT ?? 3011);
startHealthServer("worker", port);
console.log(`worker health check listening on ${port}`);

