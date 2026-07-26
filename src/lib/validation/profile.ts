export interface ProfileInput {
  fullName: string | null;
  belt: string | null;
}

export type ProfileParseResult =
  | { ok: true; value: ProfileInput }
  | { ok: false; error: string };

export const MAX_NAME_LENGTH = 80;
export const MAX_BELT_LENGTH = 40;

/**
 * Parses the profile form. Note the absence of `role`: it is deliberately not
 * user-editable, and the database rejects role changes from non-admins (see
 * migration 0003).
 */
export function parseProfileInput(input: {
  fullName?: unknown;
  belt?: unknown;
}): ProfileParseResult {
  const fullName = String(input.fullName ?? "").trim();
  if (fullName.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }

  const belt = String(input.belt ?? "").trim();
  if (belt.length > MAX_BELT_LENGTH) {
    return {
      ok: false,
      error: `Belt must be ${MAX_BELT_LENGTH} characters or fewer.`,
    };
  }

  return {
    ok: true,
    value: {
      fullName: fullName.length > 0 ? fullName : null,
      belt: belt.length > 0 ? belt : null,
    },
  };
}
