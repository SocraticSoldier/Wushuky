import { describe, expect, it } from "vitest";
import {
  addEntry,
  computeStreak,
  dayString,
  getEntries,
  promptForDay,
} from "./journal-store";

const DAY = 24 * 60 * 60 * 1000;

describe("journal store", () => {
  it("stores and reads back entries per key id", () => {
    addEntry("user-a", { prompt: "p", body: "first" });
    addEntry("user-a", { prompt: "p", body: "second" });
    const entries = getEntries("user-a");
    expect(entries).toHaveLength(2);
    // Newest first.
    expect(entries[0].body).toBe("second");
  });

  it("keeps different key ids isolated", () => {
    addEntry("user-b", { prompt: "p", body: "b-only" });
    expect(getEntries("user-c")).toHaveLength(0);
  });

  it("trims entry bodies and prompts", () => {
    const entry = addEntry("user-trim", { prompt: "  p  ", body: "  hi  " });
    expect(entry.body).toBe("hi");
    expect(entry.prompt).toBe("p");
  });

  it("dayString is a stable YYYY-MM-DD", () => {
    expect(dayString(Date.UTC(2026, 6, 28))).toBe("2026-07-28");
  });
});

describe("computeStreak", () => {
  const now = Date.UTC(2026, 6, 28, 12, 0, 0);
  const entryOn = (offsetDays: number) => ({
    id: `x${offsetDays}`,
    day: dayString(now - offsetDays * DAY),
    prompt: "p",
    body: "b",
    createdAt: Math.floor((now - offsetDays * DAY) / 1000),
  });

  it("is zero with no entries", () => {
    expect(computeStreak([], now)).toBe(0);
  });

  it("counts consecutive days up to today", () => {
    expect(computeStreak([entryOn(0), entryOn(1), entryOn(2)], now)).toBe(3);
  });

  it("stops at the first gap", () => {
    // today + 2 days ago, but yesterday missing → streak of 1.
    expect(computeStreak([entryOn(0), entryOn(2)], now)).toBe(1);
  });

  it("is zero if today has no entry", () => {
    expect(computeStreak([entryOn(1), entryOn(2)], now)).toBe(0);
  });
});

describe("promptForDay", () => {
  it("is deterministic for a given day", () => {
    expect(promptForDay("2026-07-28")).toBe(promptForDay("2026-07-28"));
  });

  it("returns a non-empty prompt", () => {
    expect(promptForDay("2026-07-28").length).toBeGreaterThan(0);
  });
});
