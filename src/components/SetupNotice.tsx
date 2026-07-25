import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Renders a one-line hint when Supabase credentials are not yet configured, so
 * the empty-state pages make sense during local setup. Renders nothing once the
 * project is wired up.
 */
export function SetupNotice() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
      <span className="font-medium">Demo mode:</span> set{" "}
      <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
      <code className="font-mono">.env.local</code>, then apply the migrations in{" "}
      <code className="font-mono">supabase/</code> to load real data.
    </div>
  );
}
