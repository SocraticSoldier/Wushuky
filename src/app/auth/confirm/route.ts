import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/routes";

const VALID_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (VALID_TYPES as string[]).includes(value);
}

/**
 * Handles the links Supabase emails out: signup confirmation, magic links,
 * password recovery, and email-change confirmation.
 *
 * Supabase appends `token_hash` and `type`; we exchange them for a session and
 * then forward the user on. The `next` destination is run through
 * `safeRedirectPath` so a crafted email link cannot turn this into an open
 * redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeRedirectPath(searchParams.get("next"));

  const failure = new URL("/login", origin);

  if (!tokenHash || !isEmailOtpType(type)) {
    failure.searchParams.set(
      "error",
      "That confirmation link is invalid or incomplete.",
    );
    return NextResponse.redirect(failure);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      failure.searchParams.set(
        "error",
        "That link has expired or was already used. Please request a new one.",
      );
      return NextResponse.redirect(failure);
    }
  } catch {
    failure.searchParams.set(
      "error",
      "We couldn't confirm that link right now. Please try again.",
    );
    return NextResponse.redirect(failure);
  }

  return NextResponse.redirect(new URL(next, origin));
}
