import { describe, expect, it } from "vitest";
import { formatDateTime, formatPrice, titleCase } from "@/lib/format";

describe("formatPrice", () => {
  it("formats minor units as pounds by default", () => {
    expect(formatPrice(5900)).toBe("£59.00");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("£0.00");
  });

  it("keeps sub-pound precision", () => {
    expect(formatPrice(5)).toBe("£0.05");
  });

  it("honours an explicit currency", () => {
    // Non-breaking spaces vary by ICU build, so assert on the parts.
    const formatted = formatPrice(1500, "USD");
    expect(formatted).toContain("15.00");
    expect(formatted).toMatch(/\$|USD/);
  });
});

describe("formatDateTime", () => {
  it("renders a readable date and time", () => {
    const formatted = formatDateTime("2026-08-01T18:30:00.000Z");
    expect(formatted).toContain("Aug");
    expect(formatted).toContain("1");
  });

  it("is stable for the same input", () => {
    const iso = "2026-08-01T18:30:00.000Z";
    expect(formatDateTime(iso)).toBe(formatDateTime(iso));
  });
});

describe("titleCase", () => {
  it("capitalises the first letter", () => {
    expect(titleCase("active")).toBe("Active");
    expect(titleCase("past_due")).toBe("Past_due");
  });

  it("leaves already-capitalised text alone", () => {
    expect(titleCase("Active")).toBe("Active");
  });

  it("handles an empty string", () => {
    expect(titleCase("")).toBe("");
  });
});
