/**
 * Auth form validation, kept pure so it can be unit tested and reused by both
 * the Server Actions and any future client-side hinting.
 */

export const MIN_PASSWORD_LENGTH = 8;

/** Basic email shape check: non-empty local part, single @, dotted domain. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates sign-in / sign-up credentials. Returns an error message, or `null`
 * when the credentials are acceptable.
 */
export function validateCredentials(
  email: string,
  password: string,
): string | null {
  if (!isValidEmail(email)) return "Please enter a valid email.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  return null;
}
