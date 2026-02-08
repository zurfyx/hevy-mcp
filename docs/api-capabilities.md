# API Capabilities

This document describes what you can do with the Hevy API through hevy-mcp.

## Workouts

Workouts are the core of Hevy — each one represents a completed gym session.

### What you can read

- **List workouts** — paginated, with an optional `since` filter to only fetch workouts updated after a given date. Returns title, start/end times, exercises, and sets.
- **Get a single workout** — full details by ID including all exercises and their sets.
- **Get workout count** — total number of workouts in your account.
- **Get workout events** — a changelog of workouts that were created, updated, or deleted since a given date. Useful for syncing or tracking changes.

### What you can write

- **Create a workout** — log a completed session with a title, start/end times, and a list of exercises. Each exercise references an exercise template and contains sets with weight, reps, distance, duration, and RPE.
- **Update a workout** — modify any field on an existing workout (title, times, exercises, sets).
- **Delete a workout** — permanently remove a workout.

### Workout data model

A workout contains:
- `title` — name of the session (e.g., "Push Day", "Morning Run")
- `description` — optional notes
- `start_time` / `end_time` — ISO 8601 timestamps
- `is_private` — visibility flag
- `exercises[]` — array of exercises performed

Each exercise contains:
- `exercise_template_id` — reference to the exercise type
- `superset_id` — optional grouping for supersets
- `notes` — per-exercise notes
- `sets[]` — array of sets performed

Each set contains:
- `type` — `normal`, `warmup`, `dropset`, or `failure`
- `weight_kg` — weight used (nullable for bodyweight)
- `reps` — repetition count
- `distance_meters` — for cardio/distance exercises
- `duration_seconds` — for timed exercises
- `rpe` — rate of perceived exertion (0–10 scale)

## Routines

Routines are workout templates — predefined exercise lists you can follow during a session.

### What you can read

- **List routines** — paginated list of all your saved routines.
- **Get a single routine** — full details including exercises and their template sets.

### What you can write

- **Create a routine** — define a new workout template with exercises and target sets.
- **Update a routine** — modify title, folder, or exercises.
- **Delete a routine** — permanently remove a routine.

Routines use the same exercise/set structure as workouts.

## Exercise Templates

Exercise templates define the types of exercises available (e.g., "Bench Press", "Squat", "Running"). Hevy comes with a large library of built-in templates, and you can create custom ones.

### What you can read

- **List exercise templates** — paginated list of all available exercises (both built-in and custom).
- **Get a single exercise template** — full details including muscle groups and equipment.

### What you can write

- **Create a custom exercise template** — define a new exercise type with:
  - `title` — exercise name
  - `type` — one of: `weight_reps`, `bodyweight_reps`, `weighted_bodyweight`, `assisted_bodyweight`, `duration`, `distance_duration`, `weight_distance`
  - `primary_muscle_group` — main muscle targeted
  - `secondary_muscle_groups` — additional muscles worked
  - `equipment` — `barbell`, `dumbbell`, `machine`, `cable`, `bodyweight`, `band`, `kettlebell`, `smith_machine`, `ez_bar`, `other`, or `none`

Available muscle groups: `abdominals`, `abductors`, `adductors`, `biceps`, `calves`, `cardio`, `chest`, `forearms`, `full_body`, `glutes`, `hamstrings`, `lats`, `lower_back`, `neck`, `other`, `quadriceps`, `shoulders`, `traps`, `triceps`, `upper_back`.

## Routine Folders

Routine folders let you organize routines into groups (e.g., "Hypertrophy Block", "Strength Program").

### What you can read

- **List routine folders** — paginated list of all folders.
- **Get a single routine folder** — folder details by ID.

### What you can write

- **Create a routine folder** — create a new folder with a title.
- **Update a routine folder** — rename a folder.
- **Delete a routine folder** — permanently remove a folder.

## Pagination

All list endpoints use page-based pagination:
- `page` — page number (starts at 1)
- `page_size` — items per page (1–10)

Responses include a `page_count` field indicating total pages available.

## Example Use Cases

- **Training log analysis** — "Show me all my workouts from the last month and summarize my volume per muscle group"
- **Program building** — "Create a push/pull/legs routine with the exercises I've been doing most"
- **Progress tracking** — "Compare my bench press sets this week vs. last week"
- **Workout logging** — "Log today's workout: squats 5x5 at 100kg, RDLs 3x10 at 80kg"
- **Organization** — "Create a folder called 'Mesocycle 2' and move my current routines into it"
- **Exercise discovery** — "List all exercise templates that target the upper back"
