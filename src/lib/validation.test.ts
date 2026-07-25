import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  validateCredentials,
} from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("jake@example.com")).toBe(true);
    expect(isValidEmail("a.b+tag@sub.example.co.uk")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("spaces in@example.com")).toBe(false);
    expect(isValidEmail("two@@example.com")).toBe(false);
  });
});

describe("validateCredentials", () => {
  const validPassword = "a".repeat(MIN_PASSWORD_LENGTH);

  it("returns null for valid credentials", () => {
    expect(validateCredentials("jake@example.com", validPassword)).toBeNull();
  });

  it("rejects an invalid email", () => {
    expect(validateCredentials("nope", validPassword)).toMatch(/valid email/i);
  });

  it("rejects a short password", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateCredentials("jake@example.com", short)).toMatch(
      /at least 8 characters/i,
    );
  });

  it("accepts a password exactly at the minimum length", () => {
    expect(validateCredentials("jake@example.com", validPassword)).toBeNull();
  });

  it("reports the email problem first when both are invalid", () => {
    expect(validateCredentials("nope", "x")).toMatch(/valid email/i);
  });
});
