import { describe, expect, it } from "vitest";
import { b64urlDecode, b64urlEncode, hmac, timingSafeEqualStr } from "./crypto";

describe("crypto", () => {
  it("base64url round-trips arbitrary bytes", () => {
    const s = 'hello — ünïcode & symbols/+=';
    expect(b64urlDecode(b64urlEncode(s)).toString("utf8")).toBe(s);
  });

  it("base64url output is url-safe (no +, /, =)", () => {
    const encoded = b64urlEncode("????>>>>////");
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("hmac is deterministic for the same secret + message", () => {
    expect(hmac("s", "m")).toBe(hmac("s", "m"));
  });

  it("hmac differs when the secret differs", () => {
    expect(hmac("secret-a", "m")).not.toBe(hmac("secret-b", "m"));
  });

  it("timingSafeEqualStr is true for equal strings", () => {
    expect(timingSafeEqualStr("abc123", "abc123")).toBe(true);
  });

  it("timingSafeEqualStr is false for different strings", () => {
    expect(timingSafeEqualStr("abc123", "abc124")).toBe(false);
  });

  it("timingSafeEqualStr is false for different lengths", () => {
    expect(timingSafeEqualStr("abc", "abcd")).toBe(false);
  });
});
