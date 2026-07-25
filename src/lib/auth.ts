import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the current authenticated user, or `null`. Always uses
 * `supabase.auth.getUser()`, which revalidates the token with the Supabase
 * Auth server — never trust `getSession()` for authorization decisions.
 */
export async function getUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    // Missing/placeholder credentials or an unreachable Auth server: treat as
    // signed-out rather than crashing the route. Protected routes will then
    // redirect to /login as usual.
    return null;
  }
}

/**
 * Ensures a user is signed in. Redirects to `/login` otherwise. Use at the top
 * of protected Server Components / layouts as the authoritative check — the
 * Proxy redirect is only a fast-path optimisation.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Ensures the signed-in user is an admin. Redirects non-admins to the
 * dashboard.
 *
 * NOTE: role storage is project-specific. This checks a `role` claim on the
 * user's `app_metadata` (settable server-side via the Supabase admin API or a
 * DB trigger). Adjust to match your chosen roles model.
 */
export async function requireAdmin() {
  const user = await requireUser();
  const role = (user.app_metadata as { role?: string } | null)?.role;
  if (role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}
