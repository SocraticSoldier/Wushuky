import { describe, expect, it } from "vitest";
import { splitBookings, type BookingWithClass } from "@/lib/data/bookings";
import type { ClassRow } from "@/lib/supabase/types";

const NOW = new Date("2026-08-15T12:00:00.000Z");

function makeBooking(id: string, startsAt: string): BookingWithClass {
  const klass: ClassRow = {
    id: `class-${id}`,
    title: `Class ${id}`,
    description: null,
    instructor: null,
    level: "all",
    starts_at: startsAt,
    duration_minutes: 60,
    capacity: 20,
    created_at: "2026-07-01T00:00:00.000Z",
  };
  return {
    bookingId: id,
    status: "booked",
    bookedAt: "2026-07-02T00:00:00.000Z",
    klass,
  };
}

describe("splitBookings", () => {
  it("separates upcoming from past by class start time", () => {
    const result = splitBookings(
      [
        makeBooking("a", "2026-08-20T18:00:00.000Z"),
        makeBooking("b", "2026-08-01T18:00:00.000Z"),
      ],
      NOW,
    );
    expect(result.upcoming.map((b) => b.bookingId)).toEqual(["a"]);
    expect(result.past.map((b) => b.bookingId)).toEqual(["b"]);
  });

  it("sorts upcoming soonest-first", () => {
    const result = splitBookings(
      [
        makeBooking("late", "2026-09-01T18:00:00.000Z"),
        makeBooking("soon", "2026-08-16T18:00:00.000Z"),
        makeBooking("mid", "2026-08-20T18:00:00.000Z"),
      ],
      NOW,
    );
    expect(result.upcoming.map((b) => b.bookingId)).toEqual([
      "soon",
      "mid",
      "late",
    ]);
  });

  it("sorts past most-recent-first", () => {
    const result = splitBookings(
      [
        makeBooking("oldest", "2026-06-01T18:00:00.000Z"),
        makeBooking("recent", "2026-08-14T18:00:00.000Z"),
        makeBooking("middle", "2026-07-01T18:00:00.000Z"),
      ],
      NOW,
    );
    expect(result.past.map((b) => b.bookingId)).toEqual([
      "recent",
      "middle",
      "oldest",
    ]);
  });

  it("counts a class starting exactly now as upcoming", () => {
    const result = splitBookings(
      [makeBooking("boundary", NOW.toISOString())],
      NOW,
    );
    expect(result.upcoming).toHaveLength(1);
    expect(result.past).toHaveLength(0);
  });

  it("handles an empty list", () => {
    expect(splitBookings([], NOW)).toEqual({ upcoming: [], past: [] });
  });

  it("does not lose any bookings", () => {
    const input = [
      makeBooking("a", "2026-08-20T18:00:00.000Z"),
      makeBooking("b", "2026-08-01T18:00:00.000Z"),
      makeBooking("c", "2026-09-01T18:00:00.000Z"),
    ];
    const result = splitBookings(input, NOW);
    expect(result.upcoming.length + result.past.length).toBe(input.length);
  });
});
