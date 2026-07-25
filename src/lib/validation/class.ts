import type { ClassLevel } from "@/lib/supabase/types";

export const CLASS_LEVELS: readonly ClassLevel[] = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
] as const;

export interface ClassInput {
  title: string;
  instructor: string | null;
  level: ClassLevel;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
}

export type ClassParseResult =
  | { ok: true; value: ClassInput }
  | { ok: false; error: string };

function isClassLevel(value: string): value is ClassLevel {
  return (CLASS_LEVELS as readonly string[]).includes(value);
}

/**
 * Parses and validates the class-creation form payload. Pure, so it can be
 * unit tested and reused; the Server Action calls this before touching the
 * database.
 */
export function parseClassInput(input: {
  title?: unknown;
  instructor?: unknown;
  level?: unknown;
  startsAt?: unknown;
  durationMinutes?: unknown;
  capacity?: unknown;
}): ClassParseResult {
  const title = String(input.title ?? "").trim();
  if (title.length === 0) return { ok: false, error: "Title is required." };
  if (title.length > 120) {
    return { ok: false, error: "Title must be 120 characters or fewer." };
  }

  const levelRaw = String(input.level ?? "all");
  if (!isClassLevel(levelRaw)) {
    return { ok: false, error: "Please choose a valid level." };
  }

  const startsAtRaw = String(input.startsAt ?? "").trim();
  if (startsAtRaw.length === 0) {
    return { ok: false, error: "Start time is required." };
  }
  const startsAtDate = new Date(startsAtRaw);
  if (Number.isNaN(startsAtDate.getTime())) {
    return { ok: false, error: "Start time is not a valid date." };
  }

  const durationMinutes = Number(input.durationMinutes ?? 60);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { ok: false, error: "Duration must be a positive whole number." };
  }
  if (durationMinutes > 600) {
    return { ok: false, error: "Duration must be 600 minutes or fewer." };
  }

  const capacity = Number(input.capacity ?? 20);
  if (!Number.isInteger(capacity) || capacity <= 0) {
    return { ok: false, error: "Capacity must be a positive whole number." };
  }
  if (capacity > 1000) {
    return { ok: false, error: "Capacity must be 1000 or fewer." };
  }

  const instructorRaw = String(input.instructor ?? "").trim();

  return {
    ok: true,
    value: {
      title,
      instructor: instructorRaw.length > 0 ? instructorRaw : null,
      level: levelRaw,
      startsAt: startsAtDate.toISOString(),
      durationMinutes,
      capacity,
    },
  };
}
