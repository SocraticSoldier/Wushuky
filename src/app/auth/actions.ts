"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateCredentials } from "@/lib/validation/auth";
import { safeRedirectPath } from "@/lib/routes";

export type AuthState = { error: string } | null;

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
