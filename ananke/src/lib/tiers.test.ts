import { describe, expect, it } from "vitest";
import { isTier, ROUTE_TIERS, tierSatisfies } from "./tiers";

describe("tiers", () => {
  it("free satisfies free but not paid", () => {
    expect(tierSatisfies("free", "free")).toBe(true);
    expect(tierSatisfies("free", "paid")).toBe(false);
  });

  it("paid satisfies both free and paid", () => {
    expect(tierSatisfies("paid", "free")).toBe(true);
    expect(tierSatisfies("paid", "paid")).toBe(true);
  });

  it("isTier only accepts known tiers", () => {
    expect(isTier("paid")).toBe(true);
    expect(isTier("free")).toBe(true);
    expect(isTier("admin")).toBe(false);
    expect(isTier(undefined)).toBe(false);
  });

  it("the journal route requires paid", () => {
    expect(ROUTE_TIERS["/api/journal"]).toBe("paid");
  });
});
