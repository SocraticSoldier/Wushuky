import { NextResponse, type NextRequest } from "next/server";
import { getSession, requireTier } from "@/lib/gate";
import {
  addEntry,
  computeStreak,
  getEntries,
  MAX_ENTRY_CHARS,
  MAX_PROMPT_CHARS,
  promptForDay,
} from "@/lib/journal-store";

// Hard ceiling on the whole request body, checked before we parse anything.
// Comfortably above a legitimate entry (MAX_ENTRY_CHARS) but small enough that
// a paid — or stolen-paid — session can't grow the in-memory store unbounded.
const MAX_BODY_BYTES = 64 * 1024;

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

  // Read the raw text first so we can reject an oversized body before parsing.
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
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
  if (text.trim().length > MAX_ENTRY_CHARS) {
    return NextResponse.json({ error: "entry_too_long" }, { status: 400 });
  }

  const cleanPrompt =
    typeof prompt === "string" && prompt.trim()
      ? prompt.slice(0, MAX_PROMPT_CHARS)
      : promptForDay();
  const entry = addEntry(session.kid, { prompt: cleanPrompt, body: text });
  const entries = getEntries(session.kid);
  return NextResponse.json({
    entry,
    streak: computeStreak(entries),
    entries,
  });
}
