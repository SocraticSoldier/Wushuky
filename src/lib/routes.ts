/**
 * Route classification shared by the Proxy and tests.
 *
 * Kept free of Next.js imports so it can be unit tested directly.
 */

/** Route prefixes that require an authenticated user. */
export const PROTECTED_PREFIXES = ["/dashboard", "/classes", "/admin"] as const;

/** Auth routes an already–signed-in user should be redirected away from. */
export const AUTH_ROUTES = ["/login", "/signup"] as const;

/**
 * True when `pathname` is a protected route. Matches the prefix exactly or as a
 * path segment boundary, so `/adminx` is NOT treated as `/admin`.
 */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** True when `pathname` is a login/signup route. */
export function isAuthPath(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}

/**
 * Guards against open redirects: only internal, absolute, single-slash paths
 * are allowed. Anything else falls back to `/dashboard`.
 */
export function safeRedirectPath(
  value: unknown,
  fallback = "/dashboard",
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  // Must be root-relative...
  if (!value.startsWith("/")) return fallback;
  // ...but not protocol-relative (`//evil.com`) or a backslash variant.
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // Reject anything smuggling a scheme or control characters.
  if (/[\x00-\x1f]/.test(value)) return fallback;
  return value;
}
