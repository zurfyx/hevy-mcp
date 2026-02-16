#!/usr/bin/env node

import { createServer, type IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";
import { loadEnv } from "./env.js";
loadEnv();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { HevyClient } from "./hevy-client.js";
import { registerReadTools } from "./tools/read.js";
import { registerWriteTools } from "./tools/write.js";

const apiKey = process.env.HEVY_API_KEY;
if (!apiKey) {
  console.error("Error: HEVY_API_KEY environment variable is required.");
  process.exit(1);
}

const writeEnabled = process.argv.includes("--write");
const transportMode = readTransportMode(process.argv);
const httpHost = readArgValue(process.argv, "--host") ?? process.env.MCP_HOST ?? "0.0.0.0";
const httpPort = Number(readArgValue(process.argv, "--port") ?? process.env.MCP_PORT ?? "8787");

const client = new HevyClient(apiKey);

if (transportMode === "stdio") {
  const server = createMcpServer(client, writeEnabled);
  const transport = new StdioServerTransport();
  await server.connect(transport);
} else {
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  const httpServer = createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.writeHead(400).end("Missing URL");
        return;
      }
      const url = new URL(req.url, `http://${httpHost}:${httpPort}`);

      if (req.method === "GET" && url.pathname === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (url.pathname !== "/mcp") {
        res.writeHead(404).end("Not found");
        return;
      }

      const method = req.method ?? "GET";
      const sessionId = firstHeader(req.headers["mcp-session-id"]);

      if (method === "POST") {
        const body = await readJsonBody(req);
        let transport: StreamableHTTPServerTransport | undefined;

        if (sessionId && transports[sessionId]) {
          transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(body)) {
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
              transports[id] = transport!;
            },
          });

          transport.onclose = () => {
            const sid = transport?.sessionId;
            if (sid && transports[sid]) delete transports[sid];
          };

          const server = createMcpServer(client, writeEnabled);
          await server.connect(transport);
        } else {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Bad Request: No valid session ID provided" },
              id: null,
            }),
          );
          return;
        }

        await transport.handleRequest(req, res, body);
        return;
      }

      if (method === "GET") {
        if (!sessionId || !transports[sessionId]) {
          res.writeHead(400).end("Invalid or missing session ID");
          return;
        }
        await transports[sessionId].handleRequest(req, res);
        return;
      }

      if (method === "DELETE") {
        if (!sessionId || !transports[sessionId]) {
          res.writeHead(400).end("Invalid or missing session ID");
          return;
        }
        await transports[sessionId].handleRequest(req, res);
        return;
      }

      res.writeHead(405).end("Method not allowed");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: message }));
    }
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(httpPort, httpHost, resolve);
  });
  console.error(`hevy-mcp HTTP listening on http://${httpHost}:${httpPort}/mcp`);
}

function createMcpServer(client: HevyClient, write: boolean): McpServer {
  const server = new McpServer({
    name: "hevy-mcp",
    version: "1.0.0",
  });
  registerReadTools(server, client);
  if (write) {
    registerWriteTools(server, client);
  }
  return server;
}

function readTransportMode(argv: string[]): "stdio" | "http" {
  const explicit = readArgValue(argv, "--transport");
  if (explicit === "http" || explicit === "stdio") return explicit;
  if (argv.includes("--http")) return "http";
  return "stdio";
}

function readArgValue(argv: string[], key: string): string | undefined {
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === key && i + 1 < argv.length) return argv[i + 1];
    if (current.startsWith(`${key}=`)) return current.slice(key.length + 1);
  }
  return undefined;
}

function firstHeader(header: string | string[] | undefined): string | undefined {
  if (Array.isArray(header)) return header[0];
  return header;
}

function isInitializeRequest(body: unknown): body is { method: string } {
  return !!body && typeof body === "object" && "method" in body && (body as { method?: unknown }).method === "initialize";
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw.length > 0 ? JSON.parse(raw) : {};
}
