import { createServer, type Server } from "node:http";

export interface HealthState {
  service: string;
  status: "ok";
  timestamp: string;
}

export function createHealthState(service: string): HealthState {
  return { service, status: "ok", timestamp: new Date().toISOString() };
}

export function startHealthServer(service: string, port: number): Server {
  return createServer((request, response) => {
    if (request.url !== "/health") {
      response.writeHead(404).end();
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(createHealthState(service)));
  }).listen(port, "0.0.0.0");
}

