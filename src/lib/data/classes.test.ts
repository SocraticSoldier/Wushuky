import { describe, expect, it } from "vitest";
import { annotateClasses } from "@/lib/data/classes";
import type { ClassRow } from "@/lib/supabase/types";

function makeClass(overrides: Partial<ClassRow> & { id: string }): ClassRow {
  return {
    title: "Foundations",
    description: null,
    instructor: null,
    level: "all",
    starts_at: "2026-08-01T18:00:00.000Z",
    duration_minutes: 60,
    capacity: 10,
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("annotateClasses", () => {
  it("computes spots left from the aggregate count", () => {
    const [result] = annotateClasses(
      [makeClass({ id: "c1", capacity: 10 })],
      [{ class_id: "c1", booked_count: 4 }],
      [],
    );
    expect(result.bookedCount).toBe(4);
    expect(result.spotsLeft).toBe(6);
    expect(result.isBooked).toBe(false);
  });

  it("treats a class with no bookings as empty", () => {
    const [result] = annotateClasses(
      [makeClass({ id: "c1", capacity: 12 })],
      [],
      [],
    );
    expect(result.bookedCount).toBe(0);
    expect(result.spotsLeft).toBe(12);
  });

  it("clamps spots left at zero when overbooked", () => {
    const [result] = annotateClasses(
      [makeClass({ id: "c1", capacity: 5 })],
      [{ class_id: "c1", booked_count: 8 }],
      [],
    );
    expect(result.spotsLeft).toBe(0);
  });

  it("reports a full class as zero spots left", () => {
    const [result] = annotateClasses(
      [makeClass({ id: "c1", capacity: 5 })],
      [{ class_id: "c1", booked_count: 5 }],
      [],
    );
    expect(result.spotsLeft).toBe(0);
  });

  it("flags classes the user has booked", () => {
    const result = annotateClasses(
      [makeClass({ id: "c1" }), makeClass({ id: "c2" })],
      [],
      ["c2"],
    );
    expect(result.find((c) => c.id === "c1")?.isBooked).toBe(false);
    expect(result.find((c) => c.id === "c2")?.isBooked).toBe(true);
  });

  it("coerces string counts coming back from postgres bigint", () => {
    const [result] = annotateClasses(
      [makeClass({ id: "c1", capacity: 10 })],
      // bigint often serialises as a string over the wire
      [{ class_id: "c1", booked_count: "3" as unknown as number }],
      [],
    );
    expect(result.bookedCount).toBe(3);
    expect(result.spotsLeft).toBe(7);
  });

  it("preserves order and passes through class fields", () => {
    const result = annotateClasses(
      [
        makeClass({ id: "c1", title: "First" }),
        makeClass({ id: "c2", title: "Second" }),
      ],
      [],
      [],
    );
    expect(result.map((c) => c.title)).toEqual(["First", "Second"]);
  });

  it("ignores counts for classes not in the list", () => {
    const result = annotateClasses(
      [makeClass({ id: "c1", capacity: 10 })],
      [
        { class_id: "c1", booked_count: 2 },
        { class_id: "ghost", booked_count: 99 },
      ],
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0].spotsLeft).toBe(8);
  });
});
