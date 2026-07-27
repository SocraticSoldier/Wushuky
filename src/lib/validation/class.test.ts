import { describe, expect, it } from "vitest";
import { PAST_GRACE_MINUTES, parseClassInput } from "@/lib/validation/class";

// Fixed reference point so these tests never rot as real time moves past the
// fixture date.
const NOW = new Date("2026-07-01T09:00:00.000Z");

const valid = {
  title: "Foundations of Wushu",
  instructor: "Sifu Chen",
  level: "beginner",
  startsAt: "2026-08-01T18:00",
  durationMinutes: 60,
  capacity: 20,
};

function expectOk(result: ReturnType<typeof parseClassInput>) {
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`);
  return result.value;
}

describe("parseClassInput", () => {
  it("accepts a well-formed class", () => {
    const value = expectOk(parseClassInput(valid, NOW));
    expect(value.title).toBe("Foundations of Wushu");
    expect(value.instructor).toBe("Sifu Chen");
    expect(value.level).toBe("beginner");
    expect(value.capacity).toBe(20);
  });

  it("normalises startsAt to an ISO string", () => {
    const value = expectOk(parseClassInput(valid, NOW));
    expect(value.startsAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(new Date(value.startsAt).getTime()).not.toBeNaN();
  });

  it("trims the title and rejects a blank one", () => {
    expect(expectOk(parseClassInput({ ...valid, title: "  Open Mat  " }, NOW)).title)
      .toBe("Open Mat");
    expect(parseClassInput({ ...valid, title: "   " }, NOW)).toMatchObject({
      ok: false,
    });
    expect(parseClassInput({ ...valid, title: undefined }, NOW)).toMatchObject({
      ok: false,
    });
  });

  it("rejects an over-long title", () => {
    const result = parseClassInput({ ...valid, title: "x".repeat(121) }, NOW);
    expect(result.ok).toBe(false);
  });

  it("treats a blank instructor as null", () => {
    expect(expectOk(parseClassInput({ ...valid, instructor: "" }, NOW)).instructor)
      .toBeNull();
    expect(expectOk(parseClassInput({ ...valid, instructor: "   " }, NOW)).instructor)
      .toBeNull();
  });

  it("rejects an unknown level", () => {
    const result = parseClassInput({ ...valid, level: "expert" }, NOW);
    expect(result).toMatchObject({ ok: false });
  });

  it("accepts every supported level", () => {
    for (const level of ["all", "beginner", "intermediate", "advanced"]) {
      expect(expectOk(parseClassInput({ ...valid, level }, NOW)).level).toBe(level);
    }
  });

  it("rejects an invalid or missing start time", () => {
    expect(parseClassInput({ ...valid, startsAt: "not-a-date" }, NOW)).toMatchObject(
      { ok: false },
    );
    expect(parseClassInput({ ...valid, startsAt: "" }, NOW)).toMatchObject({
      ok: false,
    });
  });

  it("rejects non-positive or fractional durations", () => {
    expect(parseClassInput({ ...valid, durationMinutes: 0 }, NOW).ok).toBe(false);
    expect(parseClassInput({ ...valid, durationMinutes: -30 }, NOW).ok).toBe(false);
    expect(parseClassInput({ ...valid, durationMinutes: 42.5 }, NOW).ok).toBe(false);
    expect(parseClassInput({ ...valid, durationMinutes: "abc" }, NOW).ok).toBe(false);
  });

  it("rejects an unreasonably long duration", () => {
    expect(parseClassInput({ ...valid, durationMinutes: 601 }, NOW).ok).toBe(false);
  });

  it("rejects non-positive or fractional capacity", () => {
    expect(parseClassInput({ ...valid, capacity: 0 }, NOW).ok).toBe(false);
    expect(parseClassInput({ ...valid, capacity: -5 }, NOW).ok).toBe(false);
    expect(parseClassInput({ ...valid, capacity: 2.5 }, NOW).ok).toBe(false);
  });

  it("rejects an unreasonably large capacity", () => {
    expect(parseClassInput({ ...valid, capacity: 1001 }, NOW).ok).toBe(false);
  });

  it("coerces numeric strings from form data", () => {
    const value = expectOk(
      parseClassInput({ ...valid, durationMinutes: "90", capacity: "15" }, NOW),
    );
    expect(value.durationMinutes).toBe(90);
    expect(value.capacity).toBe(15);
  });
});

describe("parseClassInput — start time must be in the future", () => {
  it("rejects a clearly past start time", () => {
    const r = parseClassInput({ ...valid, startsAt: "2020-01-01T10:00" }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/future/i);
  });

  it("rejects a start time just outside the grace window", () => {
    const past = new Date(NOW.getTime() - (PAST_GRACE_MINUTES + 1) * 60_000);
    expect(parseClassInput({ ...valid, startsAt: past.toISOString() }, NOW).ok).toBe(false);
  });

  it("allows a start time inside the grace window (clock skew)", () => {
    const recent = new Date(NOW.getTime() - (PAST_GRACE_MINUTES - 1) * 60_000);
    expect(parseClassInput({ ...valid, startsAt: recent.toISOString() }, NOW).ok).toBe(true);
  });

  it("allows a future start time", () => {
    const soon = new Date(NOW.getTime() + 60 * 60_000);
    expect(parseClassInput({ ...valid, startsAt: soon.toISOString() }, NOW).ok).toBe(true);
  });
});
