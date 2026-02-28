/**
 * CopilotKit Runtime bridge — translates GraphQL (React SDK) ↔ REST (Python remote endpoint).
 *
 * Usage:  node copilot-runtime.mjs
 * Listens on port 4111, proxies to Python backend at localhost:8000.
 */

import { readFileSync } from "node:fs";
import { createServer } from "node:http";

// Load .env from backend dir if it exists
try {
  const envPath = new URL("../backend/.env", import.meta.url).pathname;
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // no .env file, rely on exported env vars
}
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNodeHttpEndpoint,
  copilotKitEndpoint,
} from "@copilotkit/runtime";

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const PORT = Number(process.env.COPILOT_RUNTIME_PORT) || 4111;

const runtime = new CopilotRuntime({
  remoteEndpoints: [
    copilotKitEndpoint({
      url: `${PYTHON_BACKEND}/api/copilotkit`,
    }),
  ],
});

// The service adapter is required by the runtime even though agent requests
// go through the remote endpoint. OpenAIAdapter works with MiniMax's
// OpenAI-compatible API when MINIMAX_API_KEY is set.
const serviceAdapter = new OpenAIAdapter({
  openai: {
    baseURL: "https://api.minimax.io/v1",
    apiKey: process.env.MINIMAX_API_KEY || "placeholder",
  },
  model: "MiniMax-M2.5",
});

const handler = copilotRuntimeNodeHttpEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/copilotkit",
});

const server = createServer(async (req, res) => {
  // CORS headers for dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    await handler(req, res);
  } catch (err) {
    console.error("Runtime error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`CopilotKit Runtime listening on http://localhost:${PORT}/copilotkit`);
  console.log(`Proxying to Python backend at ${PYTHON_BACKEND}/api/copilotkit`);
});
