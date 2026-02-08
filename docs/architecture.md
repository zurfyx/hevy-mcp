# Architecture

## Overview

hevy-mcp is a Model Context Protocol (MCP) server that wraps the Hevy API v1. It exposes Hevy's workout tracking functionality as MCP tools that any MCP client (Claude Desktop, Claude Code, etc.) can call over stdio.

## System Diagram

```
┌──────────────┐      stdio (JSON-RPC)      ┌──────────────┐      HTTPS       ┌──────────────┐
│  MCP Client  │ ◄─────────────────────────► │   hevy-mcp   │ ◄──────────────► │  Hevy API v1 │
│ (Claude, etc)│                             │   (Node.js)  │                  │ hevyapp.com  │
└──────────────┘                             └──────────────┘                  └──────────────┘
```

The server is a long-running Node.js process that communicates with its MCP client over stdin/stdout using JSON-RPC, and makes outbound HTTPS requests to the Hevy API.

## Module Structure

```
src/
├── index.ts          # Process entry point
├── env.ts            # .env loader
├── hevy-client.ts    # HTTP client for Hevy API
└── tools/
    ├── read.ts       # Read-only tool definitions
    └── write.ts      # Mutating tool definitions
```

### `env.ts` — Environment Loader

Loads `.env` from the project root, resolved relative to the built JS file (`__dirname/..`). This means the server finds `.env` regardless of the working directory it's launched from — important because MCP clients may spawn the process from an arbitrary location. Environment variables already set in the process take precedence (won't be overwritten).

### `index.ts` — Entry Point

Responsibilities:
- Load `.env` via `env.ts`
- Validate that `HEVY_API_KEY` is set in the environment
- Parse the `--write` CLI flag from `process.argv`
- Instantiate `HevyClient` and `McpServer`
- Register tools (always read; conditionally write)
- Connect the server to a `StdioServerTransport`

This file contains no business logic — it is purely orchestration.

### `hevy-client.ts` — HTTP Client

A single `HevyClient` class encapsulates all HTTP communication with the Hevy API.

**Core methods:**
- `get(path, params?)` — GET request with optional query parameters
- `post(path, body?)` — POST request with JSON body
- `put(path, body?)` — PUT request with JSON body
- `delete(path)` — DELETE request

**Auto-pagination:**
- `getAll(path, params?)` — Iterates through all pages of a paginated endpoint, collecting results into a single array. It detects the data array automatically by finding the first array-valued key in the response object.

**Authentication:**
Every request includes an `api-key` header with the configured API key. Unlike OAuth-based APIs, Hevy uses static API keys with no refresh flow.

**Error handling:**
Non-2xx responses throw an `Error` with the status code and response body. 204 responses return `null`.

### `tools/read.ts` — Read Tools

Exports `registerReadTools(server, client)` which registers 10 read-only tools. Each tool:
1. Defines its input schema using Zod
2. Maps inputs to a `HevyClient` method call
3. Returns the JSON response as text content

### `tools/write.ts` — Write Tools

Exports `registerWriteTools(server, client)` which registers 10 mutating tools. Follows the same pattern as read tools but includes complex nested schemas for workout exercises and sets.

## Data Flow

1. MCP client sends a `tools/call` JSON-RPC request over stdin
2. The MCP SDK dispatches to the matching tool handler
3. The handler validates inputs (via Zod), calls `HevyClient` methods
4. `HevyClient` makes an HTTPS request to `api.hevyapp.com`
5. The response is serialized to JSON text and returned to the MCP client
