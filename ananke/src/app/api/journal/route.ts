import { NextResponse, type NextRequest } from "next/server";
import { getSession, requireTier } from "@/lib/gate";
import {
  addEntry,
  computeStreak,
  getEntries,
  promptForDay,
} from "@/lib/journal-store";

/**
 * The journal — ANANKE's paid feature. Two lines at the top are the entire
 * access control; everything below runs only for a valid paid session.
 */

export function GET(req: NextRequest) {
  const denied = requireTier(req, "paid");
  if (denied) return denied;

  // Safe: requireTier passed, so there is a paid session.
  const session = getSession(req)!;
  const entries = getEntries(session.kid);
  return NextResponse.json({
    prompt: promptForDay(),
    streak: computeStreak(entries),
    entries,
  });
}

export async function POST(req: NextRequest) {
  const denied = requireTier(req, "paid");
  if (denied) return denied;

  const session = getSession(req)!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { prompt, body: text } = (body ?? {}) as {
    prompt?: unknown;
    body?: unknown;
  };
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "empty_entry" }, { status: 400 });
  }

  const entry = addEntry(session.kid, {
    prompt: typeof prompt === "string" && prompt.trim() ? prompt : promptForDay(),
    body: text,
  });
  const entries = getEntries(session.kid);
  return NextResponse.json({
    entry,
    streak: computeStreak(entries),
    entries,
  });
}
