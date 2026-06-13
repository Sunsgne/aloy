import { startHealthServer } from "@aloy/shared";

const port = Number(process.env.TRAP_RECEIVER_HEALTH_PORT ?? 3012);
startHealthServer("trap-receiver", port);
console.log(`trap receiver health check listening on ${port}`);

