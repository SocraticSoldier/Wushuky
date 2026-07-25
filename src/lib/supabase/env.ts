/**
 * Returns true only when real Supabase credentials are present. The scaffold
 * ships with placeholder values in `.env.local` that are non-empty but not a
 * valid http(s) URL, so we check the shape rather than mere presence. Used to
 * degrade gracefully (render public UI, redirect protected routes) until the
 * project is configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && /^https?:\/\//.test(url));
}
