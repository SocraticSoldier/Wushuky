import { describe, expect, it } from "vitest";
import { isAuthPath, isProtectedPath, safeRedirectPath } from "@/lib/routes";

describe("isProtectedPath", () => {
  it("matches protected roots exactly", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/classes")).toBe(true);
    expect(isProtectedPath("/bookings")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/admin")).toBe(true);
  });

  it("matches nested routes under a protected root", () => {
    expect(isProtectedPath("/dashboard/settings")).toBe(true);
    expect(isProtectedPath("/admin/members/123")).toBe(true);
  });

  it("protects the password reset form", () => {
    // Reached with a session created by the recovery link.
    expect(isProtectedPath("/reset-password")).toBe(true);
  });

  it("does not match public routes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/signup")).toBe(false);
    // Requesting a reset must work while signed out.
    expect(isProtectedPath("/forgot-password")).toBe(false);
  });

  it("does not treat a prefix collision as protected", () => {
    // Guards against a naive startsWith check letting /adminx through as /admin
    expect(isProtectedPath("/adminx")).toBe(false);
    expect(isProtectedPath("/dashboards")).toBe(false);
    expect(isProtectedPath("/classesfoo")).toBe(false);
  });
});

describe("isAuthPath", () => {
  it("identifies the auth routes", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/signup")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isAuthPath("/")).toBe(false);
    expect(isAuthPath("/login/extra")).toBe(false);
    expect(isAuthPath("/dashboard")).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("allows internal absolute paths", () => {
    expect(safeRedirectPath("/classes")).toBe("/classes");
    expect(safeRedirectPath("/admin/members?page=2")).toBe(
      "/admin/members?page=2",
    );
  });

  it("blocks protocol-relative URLs (open redirect)", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.com/path")).toBe("/dashboard");
  });

  it("blocks absolute external URLs", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("http://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("blocks backslash-smuggled protocol-relative URLs", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
  });

  it("blocks paths containing control characters", () => {
    expect(safeRedirectPath("/foo\nSet-Cookie: x=1")).toBe("/dashboard");
    expect(safeRedirectPath("/foo\r\nbar")).toBe("/dashboard");
  });

  it("falls back for empty and non-string input", () => {
    expect(safeRedirectPath("")).toBe("/dashboard");
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath(42)).toBe("/dashboard");
  });

  it("honours a custom fallback", () => {
    expect(safeRedirectPath("https://evil.com", "/")).toBe("/");
  });

  // /auth/confirm builds its final destination with `new URL(next, origin)`.
  // That is only safe if a sanitised path can never resolve off-origin.
  it("always resolves to the same origin when used as a URL base path", () => {
    const origin = "https://wushukai.example";
    const hostile = [
      "//evil.com",
      "//evil.com/path",
      "https://evil.com",
      "http://evil.com",
      "javascript:alert(1)",
      "/\\evil.com",
      "\\\\evil.com",
      "/foo\nSet-Cookie: x=1",
      "",
      "   ",
    ];

    for (const input of hostile) {
      const resolved = new URL(safeRedirectPath(input), origin);
      expect(resolved.origin).toBe(origin);
    }
  });
});
