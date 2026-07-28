import { NextResponse, type NextRequest } from "next/server";
import { getSession, getTier } from "@/lib/gate";
import {
  computeStreak,
  DEMO_ENTRIES,
  getEntries,
  promptForDay,
} from "@/lib/journal-store";

/**
 * The free-demo-vs-paid-real pattern.
 *
 * This route is open, but what it returns depends on the verified tier. A free
 * request gets a canned, hard-coded demo — no real business data ever leaves
 * the server for an unpaid caller. A paid request gets the real numbers.
 */
export function GET(req: NextRequest) {
  if (getTier(req) !== "paid") {
    return NextResponse.json({
      tier: "free",
      demo: true,
      prompt: promptForDay(),
      streak: DEMO_ENTRIES.length,
      entries: DEMO_ENTRIES,
      note: "This is a demo. Unlock to keep a real journal and a real streak.",
    });
  }

  const session = getSession(req)!;
  const entries = getEntries(session.kid);
  return NextResponse.json({
    tier: "paid",
    demo: false,
    prompt: promptForDay(),
    streak: computeStreak(entries),
    entries,
  });
}
