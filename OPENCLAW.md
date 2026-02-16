# Hevy MCP + OpenClaw

This guide documents the OpenClaw-specific setup for `hevy-mcp`.

## What this adds vs standard MCP usage

For OpenClaw, this project is used as a Docker sidecar (HTTP mode), not only stdio:

- `Dockerfile` builds a production image for sidecar runtime.
- `src/index.ts` supports `--transport http`.
- Health endpoint: `GET /health`.
- MCP endpoint: `/mcp` (streamable HTTP transport).

The server still supports stdio mode for normal MCP clients.

## Security model (recommended)

- Keep `HEVY_API_KEY` only in sidecar/container env.
- Do not place tokens/secrets in OpenClaw agent workspace files.
- Use direct MCP calls from OpenClaw via `mcporter` + configured MCP server.

This keeps secrets out of workspace files while allowing tool access through the MCP boundary.

## Prerequisites

- OpenClaw gateway container running on a Docker network (example: `openclaw_default`).
- This repo built into an image and started as a sidecar on the same network.

## Build and run as sidecar

From this repo directory:

```bash
docker build -t local/hevy-mcp-http .
```

Run:

```bash
docker rm -f hevy-mcp-sidecar 2>/dev/null || true
docker run -d \
  --name hevy-mcp-sidecar \
  --network openclaw_default \
  --network-alias hevy-mcp \
  --restart unless-stopped \
  -e HEVY_API_KEY="$HEVY_API_KEY" \
  -e MCP_HOST=0.0.0.0 \
  -e MCP_PORT=8787 \
  local/hevy-mcp-http
```

## OpenClaw integration points

From inside OpenClaw gateway container, use:

- MCP transport URL: `http://hevy-mcp:8787/mcp`
- Health check: `http://hevy-mcp:8787/health`

Example check:

```bash
docker exec openclaw-openclaw-gateway-1 sh -lc 'curl -fsS http://hevy-mcp:8787/health'
```

## Direct MCP from OpenClaw (preferred)

Use direct MCP calls with `mcporter`:

```bash
mcporter --config /home/node/.openclaw/config/mcporter.json call hevy.list_workouts page=1 page_size=1 --output json
```

## Troubleshooting

- `No output — tool completed successfully`:
  - Confirm sidecar health first (`/health`).
  - Confirm OpenClaw agent is using `exec` + `mcporter call ...`, not `web_fetch`.
- `405` or `500` on MCP calls:
  - Ensure container is running the HTTP-capable build from current `src/index.ts`.
- Connection failures from OpenClaw:
  - Verify sidecar and gateway are on same Docker network.
