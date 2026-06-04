import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "../src/server.js";

test("GET /health returns ok and security headers", async () => {
  let statusCode = 0;
  let headers = {};
  let body = "";

  const request = { method: "GET", url: "/health" };
  const response = {
    writeHead(code, nextHeaders) {
      statusCode = code;
      headers = nextHeaders;
    },
    end(payload) {
      body = payload;
    }
  };

  handleRequest(request, response);

  assert.equal(statusCode, 200);
  assert.equal(JSON.parse(body).status, "ok");
  assert.equal(headers["x-frame-options"], "DENY");
});
