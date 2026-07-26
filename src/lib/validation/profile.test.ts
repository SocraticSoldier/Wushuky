import { describe, expect, it } from "vitest";
import {
  MAX_BELT_LENGTH,
  MAX_NAME_LENGTH,
  parseProfileInput,
} from "@/lib/validation/profile";

function expectOk(result: ReturnType<typeof parseProfileInput>) {
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`);
  return result.value;
}

describe("parseProfileInput", () => {
  it("accepts a name and belt", () => {
    const value = expectOk(
      parseProfileInput({ fullName: "Jake Smith", belt: "Blue" }),
    );
    expect(value).toEqual({ fullName: "Jake Smith", belt: "Blue" });
  });

  it("trims whitespace", () => {
    const value = expectOk(
      parseProfileInput({ fullName: "  Jake  ", belt: "  Blue  " }),
    );
    expect(value.fullName).toBe("Jake");
    expect(value.belt).toBe("Blue");
  });

  it("treats blank fields as null rather than empty strings", () => {
    const value = expectOk(parseProfileInput({ fullName: "  ", belt: "" }));
    expect(value.fullName).toBeNull();
    expect(value.belt).toBeNull();
  });

  it("defaults missing fields to null", () => {
    const value = expectOk(parseProfileInput({}));
    expect(value).toEqual({ fullName: null, belt: null });
  });

  it("rejects an over-long name", () => {
    const result = parseProfileInput({
      fullName: "x".repeat(MAX_NAME_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
  });

  it("accepts a name exactly at the limit", () => {
    const value = expectOk(
      parseProfileInput({ fullName: "x".repeat(MAX_NAME_LENGTH) }),
    );
    expect(value.fullName).toHaveLength(MAX_NAME_LENGTH);
  });

  it("rejects an over-long belt", () => {
    const result = parseProfileInput({ belt: "x".repeat(MAX_BELT_LENGTH + 1) });
    expect(result.ok).toBe(false);
  });

  it("ignores any attempt to submit a role", () => {
    // `role` is not part of ProfileInput; the action must never forward it.
    const value = expectOk(
      parseProfileInput({
        fullName: "Jake",
        role: "admin",
      } as { fullName: string }),
    );
    expect(value).toEqual({ fullName: "Jake", belt: null });
    expect("role" in value).toBe(false);
  });
});
