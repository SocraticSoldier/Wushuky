import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// In Next.js 16, Middleware is called Proxy. This runs before matched requests
// to keep the Supabase auth session fresh and gate protected routes.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico and common static asset extensions
     * Feel free to widen this as needed.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
