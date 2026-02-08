import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HevyClient } from "../hevy-client.js";

export function registerReadTools(server: McpServer, client: HevyClient) {
  server.tool(
    "list_workouts",
    "List workouts with optional pagination and date filters",
    {
      page: z.number().int().positive().optional().describe("Page number (default 1)"),
      page_size: z.number().int().min(1).max(10).optional().describe("Items per page (1-10, default 5)"),
      since: z.string().optional().describe("ISO 8601 date to filter workouts updated since"),
    },
    async ({ page, page_size, since }) => {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (page_size !== undefined) params.page_size = String(page_size);
      if (since !== undefined) params.since = since;
      const result = await client.get("/v1/workouts", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_workout",
    "Get a specific workout by ID",
    {
      workout_id: z.string().describe("The workout ID"),
    },
    async ({ workout_id }) => {
      const result = await client.get(`/v1/workouts/${workout_id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_workout_count",
    "Get the total number of workouts",
    {},
    async () => {
      const result = await client.get("/v1/workouts/count");
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_workout_events",
    "Get workout events (created, updated, deleted) since a given date",
    {
      page: z.number().int().positive().optional().describe("Page number (default 1)"),
      page_size: z.number().int().min(1).max(10).optional().describe("Items per page (1-10, default 5)"),
      since: z.string().optional().describe("ISO 8601 date to filter events since"),
    },
    async ({ page, page_size, since }) => {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (page_size !== undefined) params.page_size = String(page_size);
      if (since !== undefined) params.since = since;
      const result = await client.get("/v1/workouts/events", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_routines",
    "List routines with optional pagination",
    {
      page: z.number().int().positive().optional().describe("Page number (default 1)"),
      page_size: z.number().int().min(1).max(10).optional().describe("Items per page (1-10, default 5)"),
    },
    async ({ page, page_size }) => {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (page_size !== undefined) params.page_size = String(page_size);
      const result = await client.get("/v1/routines", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_routine",
    "Get a specific routine by ID",
    {
      routine_id: z.string().describe("The routine ID"),
    },
    async ({ routine_id }) => {
      const result = await client.get(`/v1/routines/${routine_id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_exercise_templates",
    "List exercise templates with optional pagination",
    {
      page: z.number().int().positive().optional().describe("Page number (default 1)"),
      page_size: z.number().int().min(1).max(10).optional().describe("Items per page (1-10, default 5)"),
    },
    async ({ page, page_size }) => {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (page_size !== undefined) params.page_size = String(page_size);
      const result = await client.get("/v1/exercise_templates", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_exercise_template",
    "Get a specific exercise template by ID",
    {
      exercise_template_id: z.string().describe("The exercise template ID"),
    },
    async ({ exercise_template_id }) => {
      const result = await client.get(`/v1/exercise_templates/${exercise_template_id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_routine_folders",
    "List routine folders with optional pagination",
    {
      page: z.number().int().positive().optional().describe("Page number (default 1)"),
      page_size: z.number().int().min(1).max(10).optional().describe("Items per page (1-10, default 5)"),
    },
    async ({ page, page_size }) => {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (page_size !== undefined) params.page_size = String(page_size);
      const result = await client.get("/v1/routine_folders", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_routine_folder",
    "Get a specific routine folder by ID",
    {
      routine_folder_id: z.string().describe("The routine folder ID"),
    },
    async ({ routine_folder_id }) => {
      const result = await client.get(`/v1/routine_folders/${routine_folder_id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
