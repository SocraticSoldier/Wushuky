import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Route prefixes that require an authenticated user. */
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

/** Auth routes an already–signed-in user should be redirected away from. */
const AUTH_ROUTES = ["/login", "/signup"];

/**
 * Refreshes the Supabase auth session on every matched request and performs
 * coarse-grained redirects.
 *
 * IMPORTANT: this must run so that expired tokens are refreshed and the new
 * cookies are written back to the browser. Redirects here are an optimisation
 * only — authorization is still enforced in each protected layout/action (see
 * `src/lib/auth.ts`), per the Next.js data-security guidance.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Without real credentials there is no session to manage; let the request
  // through untouched so the app can still boot with the placeholder .env.
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getUser — it refreshes the
  // token and a gap can cause hard-to-debug random logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
