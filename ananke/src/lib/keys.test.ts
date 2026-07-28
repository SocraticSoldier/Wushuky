import { describe, expect, it } from "vitest";
import { isRevoked, mintKey, verifyKey, type KeyPayload } from "./keys";

const SECRET = "test-key-secret";
const OTHER = "attacker-secret";
const NOW = 1_700_000_000;

function paid(overrides: Partial<KeyPayload> = {}): KeyPayload {
  return { v: 1, kid: "k_test", tier: "paid", iat: NOW, ...overrides };
}

describe("keys — mint / verify", () => {
  it("a freshly minted key verifies", () => {
    const key = mintKey(paid(), SECRET);
    const result = verifyKey(key, { now: NOW, secret: SECRET });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload.tier).toBe("paid");
  });

  it("carries its tier and kid through the round trip", () => {
    const key = mintKey(paid({ kid: "jake-phone" }), SECRET);
    const result = verifyKey(key, { now: NOW, secret: SECRET });
    expect(result.ok && result.payload.kid).toBe("jake-phone");
  });

  it("rejects a tampered payload (signature no longer matches)", () => {
    const key = mintKey(paid({ tier: "free" }), SECRET);
    const [, sig] = key.split(".");
    // Swap the body for a forged 'paid' payload, keep the old signature.
    const forgedBody = Buffer.from(
      JSON.stringify(paid({ tier: "paid" })),
    ).toString("base64url");
    const forged = `${forgedBody}.${sig}`;
    expect(verifyKey(forged, { now: NOW, secret: SECRET }).ok).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const key = mintKey(paid(), SECRET);
    const [body] = key.split(".");
    expect(verifyKey(`${body}.deadbeef`, { now: NOW, secret: SECRET }).ok).toBe(false);
  });

  it("rejects a key forged under a different secret (cross-secret)", () => {
    const key = mintKey(paid(), OTHER);
    expect(verifyKey(key, { now: NOW, secret: SECRET }).ok).toBe(false);
  });

  it("rejects an expired key", () => {
    const key = mintKey(paid({ exp: NOW + 100 }), SECRET);
    expect(verifyKey(key, { now: NOW + 200, secret: SECRET }).ok).toBe(false);
  });

  it("accepts a not-yet-expired key", () => {
    const key = mintKey(paid({ exp: NOW + 100 }), SECRET);
    expect(verifyKey(key, { now: NOW + 50, secret: SECRET }).ok).toBe(true);
  });

  it("accepts a key with no expiry", () => {
    const key = mintKey(paid(), SECRET);
    expect(verifyKey(key, { now: NOW + 10_000_000, secret: SECRET }).ok).toBe(true);
  });

  it("rejects a malformed key with no dot", () => {
    expect(verifyKey("not-a-key", { now: NOW, secret: SECRET }).ok).toBe(false);
  });

  it("rejects a key with more than one dot", () => {
    expect(verifyKey("a.b.c", { now: NOW, secret: SECRET }).ok).toBe(false);
  });

  it("rejects a well-signed payload of the wrong shape", () => {
    // Correctly signed, but the payload isn't a valid KeyPayload — shape
    // validation must still reject it.
    const key = mintKey({ v: 2, hacker: true } as unknown as KeyPayload, SECRET);
    expect(verifyKey(key, { now: NOW, secret: SECRET }).ok).toBe(false);
  });
});

describe("keys — revocation", () => {
  it("is not revoked when the list is empty", () => {
    expect(isRevoked("k_test", "")).toBe(false);
    expect(isRevoked("k_test", undefined)).toBe(false);
  });

  it("is revoked when the id is on a comma-separated list", () => {
    expect(isRevoked("jake-phone", "other, jake-phone ,x")).toBe(true);
  });

  it("is revoked when the id is on a whitespace-separated list", () => {
    expect(isRevoked("jake-phone", "other jake-phone x")).toBe(true);
  });

  it("is not revoked when the id is absent", () => {
    expect(isRevoked("k_test", "a,b,c")).toBe(false);
  });
});
