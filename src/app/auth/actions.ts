"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  validateCredentials,
} from "@/lib/validation/auth";
import { safeRedirectPath } from "@/lib/routes";

export type AuthState = { error: string } | null;

/** Result shape for flows that stay on the page and report progress inline. */
export type AuthFeedback = { error: string } | { success: string } | null;

/** Best-effort absolute origin for building email redirect links. */
async function getOrigin(): Promise<string | null> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

/**
 * Runs a Supabase auth call and normalises failures into a user-facing message.
 * Returns `null` on success, or an error string. A thrown exception (e.g.
 * missing/placeholder credentials, unreachable Auth server) becomes a generic
 * message instead of a 500.
 */
async function tryAuth(
  fn: () => Promise<string | null>,
): Promise<string | null> {
  try {
    return await fn();
  } catch {
    return "Authentication is currently unavailable. Please try again later.";
  }
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const validationError = validateCredentials(email, password);
  if (validationError) return { error: validationError };

  const error = await tryAuth(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error?.message ?? null;
  });
  if (error) return { error };

  const redirectTo = safeRedirectPath(formData.get("redirectTo"));
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const validationError = validateCredentials(email, password);
  if (validationError) return { error: validationError };

  const error = await tryAuth(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  });
  if (error) return { error };

  // With email confirmation enabled, the user must verify before a session
  // exists. Send them to login with a hint either way.
  redirect("/login?message=Check your email to confirm your account.");
}

export async function signOut() {
  await tryAuth(async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return null;
  });
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Sends a password-recovery email. Always reports success, even when the email
 * is unknown, so this cannot be used to enumerate registered accounts.
 */
export async function requestPasswordReset(
  _prevState: AuthFeedback,
  formData: FormData,
): Promise<AuthFeedback> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) return { error: "Please enter a valid email." };

  const genericSuccess = {
    success: "If that email is registered, a reset link is on its way.",
  };

  try {
    const origin = await getOrigin();
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: origin
        ? `${origin}/auth/confirm?next=/reset-password`
        : undefined,
    });
  } catch {
    return {
      error: "We couldn't send that email right now. Please try again later.",
    };
  }

  return genericSuccess;
}

/**
 * Sets a new password for the signed-in user. Reached after following a
 * recovery link, which establishes a session via /auth/confirm.
 */
export async function updatePassword(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }
  if (password !== confirm) return { error: "Passwords do not match." };

  const error = await tryAuth(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    return error?.message ?? null;
  });
  if (error) return { error };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
