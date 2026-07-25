import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Reads the public project URL and anon key from the environment. These are
 * safe to expose to the browser — row level security on the Supabase project
 * is what protects your data.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * A lazily-initialised singleton client for convenient imports in client
 * components. Prefer `createClient()` when you need a fresh instance.
 */
let browserClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
