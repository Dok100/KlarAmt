import http from "node:http";

const securityHeaders = {
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "cross-origin-resource-policy": "same-origin",
  "referrer-policy": "no-referrer",
  "cache-control": "no-store"
};

export function handleRequest(request, response) {
  if (!request.url) {
    response.writeHead(400, securityHeaders);
    response.end(JSON.stringify({ error: "invalid_request" }));
    return;
  }

  if (request.method !== "GET") {
    response.writeHead(405, securityHeaders);
    response.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  if (request.url === "/health") {
    response.writeHead(200, securityHeaders);
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  response.writeHead(200, securityHeaders);
  response.end(
    JSON.stringify({
      service: "node-api",
      message: "API-Grundgeruest aus dem Codex-Projekt-Framework."
    })
  );
}

export function createServer() {
  return http.createServer(handleRequest);
}
