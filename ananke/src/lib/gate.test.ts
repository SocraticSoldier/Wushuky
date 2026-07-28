import { beforeAll, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { getTier, requireTier } from "./gate";
import { createSessionValue, SESSION_COOKIE, type SessionData } from "./session";

// The gate reads SESSION_SECRET from the environment; set it before minting
// any cookie so signatures line up.
const SECRET = "gate-test-secret";
beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

const futureExp = () => Math.floor(Date.now() / 1000) + 1000;

function reqWith(cookieValue?: string): NextRequest {
  return {
    cookies: {
      get: (name: string) =>
        name === SESSION_COOKIE && cookieValue
          ? { name, value: cookieValue }
          : undefined,
    },
  } as unknown as NextRequest;
}

function cookie(data: Partial<SessionData>): string {
  return createSessionValue(
    { kid: "k", tier: "paid", exp: futureExp(), ...data },
    SECRET,
  );
}

describe("gate — the server is the gate", () => {
  it("no cookie is treated as free and denied a paid route", () => {
    const req = reqWith();
    expect(getTier(req)).toBe("free");
    const denied = requireTier(req, "paid");
    expect(denied?.status).toBe(402);
  });

  it("a free session is denied a paid route", () => {
    const denied = requireTier(reqWith(cookie({ tier: "free" })), "paid");
    expect(denied?.status).toBe(402);
  });

  it("a valid paid session passes a paid route", () => {
    const req = reqWith(cookie({ tier: "paid" }));
    expect(getTier(req)).toBe("paid");
    expect(requireTier(req, "paid")).toBeNull();
  });

  it("a paid session passes a free route", () => {
    expect(requireTier(reqWith(cookie({ tier: "paid" })), "free")).toBeNull();
  });

  it("a forged 'paid' cookie (wrong secret) is treated as free and denied", () => {
    // The attacker mints their own cookie claiming paid, under a secret they
    // don't have. The gate re-verifies the signature and falls back to free.
    const forged = createSessionValue(
      { kid: "attacker", tier: "paid", exp: futureExp() },
      "not-the-real-secret",
    );
    const req = reqWith(forged);
    expect(getTier(req)).toBe("free");
    expect(requireTier(req, "paid")?.status).toBe(402);
  });
});
