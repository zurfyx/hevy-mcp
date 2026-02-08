# Design Decisions

## Read-only by Default

Write tools (create, update, delete) are only registered when the `--write` flag is passed. This prevents accidental mutations — an LLM could otherwise create or delete workouts without the user realizing write operations were available.

This is a deliberate friction: users must opt in to write access by modifying their MCP server config.

## Thin API Wrapper

Tools map 1:1 to Hevy API endpoints with minimal transformation. The server does not aggregate, filter, or restructure data beyond what the API returns. Reasons:

- **Transparency.** The LLM sees the same data shape the API returns, making it easy to reason about and cross-reference with Hevy's documentation.
- **Maintainability.** Changes to the Hevy API only require updating the corresponding tool, not reworking intermediate data layers.
- **Flexibility.** The LLM can interpret and combine raw data however the user needs, rather than being constrained by opinionated server-side transformations.

## Static API Key Authentication

Hevy uses a simple `api-key` header for authentication, unlike OAuth flows (e.g., Strava). This means:

- No token refresh logic is needed
- No client ID/secret management
- The key is passed via the `HEVY_API_KEY` environment variable

The tradeoff is that API keys don't expire automatically — users must manually revoke them if compromised.

## Zod for Input Validation

Tool inputs are defined as Zod schemas. The MCP SDK uses these schemas both for:

1. **Validation** — rejecting malformed inputs before they reach the API
2. **Documentation** — generating tool descriptions that the LLM can read to understand what parameters are available

This avoids duplicating validation logic and keeps tool definitions self-documenting.

## Nested Schemas for Exercises and Sets

Write tools for workouts and routines accept nested exercise/set structures. These are defined as shared Zod schemas (`SetSchema`, `ExerciseSchema`) at the module level in `write.ts` to avoid duplication across `create_workout`, `update_workout`, `create_routine`, and `update_routine`.

## Auto-Pagination

The `getAll` method on `HevyClient` handles pagination automatically. It's not currently exposed as a tool directly, but is available for any tool that needs to fetch complete datasets. The Hevy API uses `page` and `page_size` query parameters with a `page_count` field in responses to indicate total pages.

## Stdio Transport

The server communicates over stdin/stdout using the MCP stdio transport. This is the standard for local MCP servers — the client (Claude Desktop, Claude Code) spawns the server as a subprocess and communicates via JSON-RPC over the process streams. No network ports, no HTTP server, no configuration beyond the command to run.

## .env Loading Relative to Project Root

The server loads `.env` by resolving the path relative to the built JS file's location (`__dirname/..`), not the current working directory. This is necessary because MCP clients spawn the server as a subprocess and may not set the working directory to the project root. Using `--env-file=.env` (Node's built-in flag) would fail in that case since it resolves relative to `cwd`. The custom loader also avoids adding a runtime dependency like `dotenv`. Existing environment variables take precedence over `.env` values, so the `env` block in MCP client configs still works as an override.

## Separation of Read and Write Modules

Tools are split into `tools/read.ts` and `tools/write.ts` rather than organized by resource (e.g., `tools/workouts.ts`, `tools/routines.ts`). This decision optimizes for the primary access control boundary — read vs. write — rather than domain grouping. It keeps the conditional registration in `index.ts` simple: one import and one function call per access level.
