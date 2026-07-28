import { NextResponse, type NextRequest } from "next/server";
import { getTier } from "@/lib/gate";
import { SESSION_COOKIE } from "@/lib/session";

// GET the current tier, for the UI to decide what to render. Never trusted as
// an access decision — that is what the gate on each protected route is for.
export function GET(req: NextRequest) {
  return NextResponse.json({ tier: getTier(req) });
}

// DELETE clears the session cookie ("lock again").
export function DELETE() {
  const res = NextResponse.json({ ok: true, tier: "free" });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
