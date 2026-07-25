import { describe, expect, it } from "vitest";
import { parseClassInput } from "@/lib/validation/class";

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
    const value = expectOk(parseClassInput(valid));
    expect(value.title).toBe("Foundations of Wushu");
    expect(value.instructor).toBe("Sifu Chen");
    expect(value.level).toBe("beginner");
    expect(value.capacity).toBe(20);
  });

  it("normalises startsAt to an ISO string", () => {
    const value = expectOk(parseClassInput(valid));
    expect(value.startsAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(new Date(value.startsAt).getTime()).not.toBeNaN();
  });

  it("trims the title and rejects a blank one", () => {
    expect(expectOk(parseClassInput({ ...valid, title: "  Open Mat  " })).title)
      .toBe("Open Mat");
    expect(parseClassInput({ ...valid, title: "   " })).toMatchObject({
      ok: false,
    });
    expect(parseClassInput({ ...valid, title: undefined })).toMatchObject({
      ok: false,
    });
  });

  it("rejects an over-long title", () => {
    const result = parseClassInput({ ...valid, title: "x".repeat(121) });
    expect(result.ok).toBe(false);
  });

  it("treats a blank instructor as null", () => {
    expect(expectOk(parseClassInput({ ...valid, instructor: "" })).instructor)
      .toBeNull();
    expect(expectOk(parseClassInput({ ...valid, instructor: "   " })).instructor)
      .toBeNull();
  });

  it("rejects an unknown level", () => {
    const result = parseClassInput({ ...valid, level: "expert" });
    expect(result).toMatchObject({ ok: false });
  });

  it("accepts every supported level", () => {
    for (const level of ["all", "beginner", "intermediate", "advanced"]) {
      expect(expectOk(parseClassInput({ ...valid, level })).level).toBe(level);
    }
  });

  it("rejects an invalid or missing start time", () => {
    expect(parseClassInput({ ...valid, startsAt: "not-a-date" })).toMatchObject(
      { ok: false },
    );
    expect(parseClassInput({ ...valid, startsAt: "" })).toMatchObject({
      ok: false,
    });
  });

  it("rejects non-positive or fractional durations", () => {
    expect(parseClassInput({ ...valid, durationMinutes: 0 }).ok).toBe(false);
    expect(parseClassInput({ ...valid, durationMinutes: -30 }).ok).toBe(false);
    expect(parseClassInput({ ...valid, durationMinutes: 42.5 }).ok).toBe(false);
    expect(parseClassInput({ ...valid, durationMinutes: "abc" }).ok).toBe(false);
  });

  it("rejects an unreasonably long duration", () => {
    expect(parseClassInput({ ...valid, durationMinutes: 601 }).ok).toBe(false);
  });

  it("rejects non-positive or fractional capacity", () => {
    expect(parseClassInput({ ...valid, capacity: 0 }).ok).toBe(false);
    expect(parseClassInput({ ...valid, capacity: -5 }).ok).toBe(false);
    expect(parseClassInput({ ...valid, capacity: 2.5 }).ok).toBe(false);
  });

  it("rejects an unreasonably large capacity", () => {
    expect(parseClassInput({ ...valid, capacity: 1001 }).ok).toBe(false);
  });

  it("coerces numeric strings from form data", () => {
    const value = expectOk(
      parseClassInput({ ...valid, durationMinutes: "90", capacity: "15" }),
    );
    expect(value.durationMinutes).toBe(90);
    expect(value.capacity).toBe(15);
  });
});
