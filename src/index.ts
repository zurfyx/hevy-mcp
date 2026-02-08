#!/usr/bin/env node

import { loadEnv } from "./env.js";
loadEnv();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HevyClient } from "./hevy-client.js";
import { registerReadTools } from "./tools/read.js";
import { registerWriteTools } from "./tools/write.js";

const apiKey = process.env.HEVY_API_KEY;
if (!apiKey) {
  console.error("Error: HEVY_API_KEY environment variable is required.");
  process.exit(1);
}

const writeEnabled = process.argv.includes("--write");

const client = new HevyClient(apiKey);

const server = new McpServer({
  name: "hevy-mcp",
  version: "1.0.0",
});

registerReadTools(server, client);

if (writeEnabled) {
  registerWriteTools(server, client);
}

const transport = new StdioServerTransport();
await server.connect(transport);
