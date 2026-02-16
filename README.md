# hevy-mcp

MCP server for the [Hevy](https://hevyapp.com) workout tracking API (v1). Exposes Hevy data as tools that Claude Desktop, Claude Code, or any MCP client can call.

Read-only by default. Pass `--write` to enable mutating tools (create, update, delete).

OpenClaw-specific onboarding and sidecar setup: [`OPENCLAW.md`](OPENCLAW.md).

## Getting Started

### 1. Get a Hevy API Key

Generate an API key from your Hevy account settings (requires an active Hevy subscription).

### 2. Set up your environment

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
HEVY_API_KEY=your-api-key-here
```

### 3. Build

```bash
cd hevy-mcp
pnpm install
pnpm build
```

### 4. Test locally

Run the MCP Inspector to verify the server starts and browse tools interactively:

```bash
pnpm inspect
```

This opens a web UI where you can see the registered tools and call them against the live API. You can also run `pnpm start` to verify the server starts without errors.

### 5. Configure your MCP client

The server automatically loads `.env` from the project root (resolved relative to the built JS, so it works regardless of working directory). If you've already set up `.env` in step 2, the config only needs the command and path:

```json
{
  "mcpServers": {
    "hevy": {
      "command": "node",
      "args": ["/absolute/path/to/hevy-mcp/build/index.js"]
    }
  }
}
```

Alternatively, you can pass the key via the config's `env` block instead of using a `.env` file:

```json
{
  "mcpServers": {
    "hevy": {
      "command": "node",
      "args": ["/absolute/path/to/hevy-mcp/build/index.js"],
      "env": {
        "HEVY_API_KEY": "<your-hevy-api-key>"
      }
    }
  }
}
```

An example config is provided in [`docs/claude-config-example.json`](docs/claude-config-example.json).

To enable write access (create/update/delete), add `"--write"` to `args`:

```json
"args": ["/absolute/path/to/hevy-mcp/build/index.js", "--write"]
```

## Tools

### Read tools (always enabled)

| Tool | Description |
|------|-------------|
| `list_workouts` | List workouts with pagination and date filters |
| `get_workout` | Get a single workout by ID |
| `get_workout_count` | Get total number of workouts |
| `get_workout_events` | Get workout events (created/updated/deleted) since a date |
| `list_routines` | List routines with pagination |
| `get_routine` | Get a single routine by ID |
| `list_exercise_templates` | List exercise templates with pagination |
| `get_exercise_template` | Get a single exercise template by ID |
| `list_routine_folders` | List routine folders with pagination |
| `get_routine_folder` | Get a single routine folder by ID |

### Write tools (requires `--write`)

| Tool | Description |
|------|-------------|
| `create_workout` | Create a new workout with exercises and sets |
| `update_workout` | Update an existing workout |
| `delete_workout` | Delete a workout |
| `create_routine` | Create a new routine |
| `update_routine` | Update an existing routine |
| `delete_routine` | Delete a routine |
| `create_exercise_template` | Create a custom exercise template |
| `create_routine_folder` | Create a routine folder |
| `update_routine_folder` | Rename a routine folder |
| `delete_routine_folder` | Delete a routine folder |

## Architecture

```
hevy-mcp/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts          # Entry point
│   ├── env.ts            # .env loader (resolves relative to project root)
│   ├── hevy-client.ts    # Hevy API HTTP client
│   └── tools/
│       ├── read.ts       # Read-only tool registrations
│       └── write.ts      # Mutating tool registrations
└── build/                # Compiled output (git-ignored)
```

### Entry point (`src/index.ts`)

Validates the `HEVY_API_KEY` environment variable, parses the `--write` CLI flag, creates the client and server, registers tools, and connects over stdio. The server exits immediately with an error if no API key is set.

### HTTP client (`src/hevy-client.ts`)

`HevyClient` wraps the Hevy REST API at `https://api.hevyapp.com`. It sends the API key via the `api-key` header on every request and exposes `get`, `post`, `put`, and `delete` methods. A `getAll` helper auto-paginates through list endpoints and returns combined results.

### Tool registration (`src/tools/`)

Tools are split into two modules — `read.ts` and `write.ts` — each exporting a `register*Tools(server, client)` function. This separation lets the entry point conditionally load write tools only when `--write` is passed, keeping the server read-only by default.

Each tool uses Zod schemas for input validation (handled automatically by the MCP SDK) and returns JSON responses as text content.

### Design decisions

- **Read-only by default.** Write tools are opt-in via `--write` to prevent accidental mutations. This matches the pattern used by sibling MCP servers in this repo.
- **Thin wrapper over the API.** Tools map directly to Hevy API endpoints with minimal transformation. The server passes structured JSON responses through to the LLM so it can interpret the data itself.
- **Auto-pagination.** `getAll` iterates through all pages of a paginated endpoint, useful for tools or workflows that need complete data sets.
- **No token refresh.** Unlike OAuth-based APIs, Hevy uses a static API key, so there is no refresh flow needed.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system diagram, module breakdown, data flow
- [`docs/decisions.md`](docs/decisions.md) — rationale behind key design choices
- [`docs/api-capabilities.md`](docs/api-capabilities.md) — what you can do with the Hevy API, data models, and example use cases
- [`docs/claude-config-example.json`](docs/claude-config-example.json) — copy-paste MCP client config
