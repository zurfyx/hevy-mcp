import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HevyClient } from "../hevy-client.js";

const SetSchema = z.object({
  type: z.enum(["normal", "warmup", "dropset", "failure"]).describe("Set type"),
  weight_kg: z.number().nullable().optional().describe("Weight in kg"),
  reps: z.number().int().nullable().optional().describe("Number of reps"),
  distance_meters: z.number().nullable().optional().describe("Distance in meters"),
  duration_seconds: z.number().int().nullable().optional().describe("Duration in seconds"),
  rpe: z.number().nullable().optional().describe("Rate of perceived exertion (0-10)"),
});

const ExerciseSchema = z.object({
  exercise_template_id: z.string().describe("Exercise template ID"),
  superset_id: z.number().int().nullable().optional().describe("Superset group ID"),
  notes: z.string().optional().describe("Exercise notes"),
  sets: z.array(SetSchema).describe("Array of sets"),
});

export function registerWriteTools(server: McpServer, client: HevyClient) {
  server.tool(
    "create_workout",
    "Create a new workout",
    {
      workout: z.object({
        title: z.string().describe("Workout title"),
        description: z.string().optional().describe("Workout description"),
        start_time: z.string().describe("ISO 8601 start time"),
        end_time: z.string().describe("ISO 8601 end time"),
        is_private: z.boolean().optional().describe("Whether workout is private"),
        exercises: z.array(ExerciseSchema).describe("Array of exercises"),
      }),
    },
    async ({ workout }) => {
      const result = await client.post("/v1/workouts", { workout });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_workout",
    "Update an existing workout",
    {
      workout_id: z.string().describe("The workout ID to update"),
      workout: z.object({
        title: z.string().optional().describe("Workout title"),
        description: z.string().optional().describe("Workout description"),
        start_time: z.string().optional().describe("ISO 8601 start time"),
        end_time: z.string().optional().describe("ISO 8601 end time"),
        is_private: z.boolean().optional().describe("Whether workout is private"),
        exercises: z.array(ExerciseSchema).optional().describe("Array of exercises"),
      }),
    },
    async ({ workout_id, workout }) => {
      const result = await client.put(`/v1/workouts/${workout_id}`, { workout });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_workout",
    "Delete a workout by ID",
    {
      workout_id: z.string().describe("The workout ID to delete"),
    },
    async ({ workout_id }) => {
      await client.delete(`/v1/workouts/${workout_id}`);
      return { content: [{ type: "text" as const, text: "Workout deleted successfully." }] };
    }
  );

  server.tool(
    "create_routine",
    "Create a new routine",
    {
      routine: z.object({
        title: z.string().describe("Routine title"),
        folder_id: z.number().int().nullable().optional().describe("Folder ID to place routine in"),
        exercises: z.array(ExerciseSchema).describe("Array of exercises"),
      }),
    },
    async ({ routine }) => {
      const result = await client.post("/v1/routines", { routine });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_routine",
    "Update an existing routine",
    {
      routine_id: z.string().describe("The routine ID to update"),
      routine: z.object({
        title: z.string().optional().describe("Routine title"),
        folder_id: z.number().int().nullable().optional().describe("Folder ID"),
        exercises: z.array(ExerciseSchema).optional().describe("Array of exercises"),
      }),
    },
    async ({ routine_id, routine }) => {
      const result = await client.put(`/v1/routines/${routine_id}`, { routine });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_routine",
    "Delete a routine by ID",
    {
      routine_id: z.string().describe("The routine ID to delete"),
    },
    async ({ routine_id }) => {
      await client.delete(`/v1/routines/${routine_id}`);
      return { content: [{ type: "text" as const, text: "Routine deleted successfully." }] };
    }
  );

  server.tool(
    "create_exercise_template",
    "Create a custom exercise template",
    {
      exercise_template: z.object({
        title: z.string().describe("Exercise name"),
        type: z.enum(["weight_reps", "bodyweight_reps", "weighted_bodyweight", "assisted_bodyweight", "duration", "distance_duration", "weight_distance"]).describe("Exercise type"),
        primary_muscle_group: z.enum([
          "abdominals", "abductors", "adductors", "biceps", "calves",
          "cardio", "chest", "forearms", "full_body", "glutes",
          "hamstrings", "lats", "lower_back", "neck", "other",
          "quadriceps", "shoulders", "traps", "triceps", "upper_back",
        ]).describe("Primary muscle group"),
        secondary_muscle_groups: z.array(z.enum([
          "abdominals", "abductors", "adductors", "biceps", "calves",
          "cardio", "chest", "forearms", "full_body", "glutes",
          "hamstrings", "lats", "lower_back", "neck", "other",
          "quadriceps", "shoulders", "traps", "triceps", "upper_back",
        ])).optional().describe("Secondary muscle groups"),
        equipment: z.enum([
          "barbell", "dumbbell", "machine", "cable", "bodyweight",
          "band", "kettlebell", "smith_machine", "ez_bar", "other", "none",
        ]).optional().describe("Equipment used"),
      }),
    },
    async ({ exercise_template }) => {
      const result = await client.post("/v1/exercise_templates", { exercise_template });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_routine_folder",
    "Create a new routine folder",
    {
      routine_folder: z.object({
        title: z.string().describe("Folder title"),
      }),
    },
    async ({ routine_folder }) => {
      const result = await client.post("/v1/routine_folders", { routine_folder });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_routine_folder",
    "Update a routine folder",
    {
      routine_folder_id: z.string().describe("The routine folder ID to update"),
      routine_folder: z.object({
        title: z.string().describe("New folder title"),
      }),
    },
    async ({ routine_folder_id, routine_folder }) => {
      const result = await client.put(`/v1/routine_folders/${routine_folder_id}`, { routine_folder });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_routine_folder",
    "Delete a routine folder by ID",
    {
      routine_folder_id: z.string().describe("The routine folder ID to delete"),
    },
    async ({ routine_folder_id }) => {
      await client.delete(`/v1/routine_folders/${routine_folder_id}`);
      return { content: [{ type: "text" as const, text: "Routine folder deleted successfully." }] };
    }
  );
}
