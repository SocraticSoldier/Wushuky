/**
 * The journal + accountability store.
 *
 * Deliberately in-memory for this first build: entries live in the running
 * server process, keyed by the licence-key id that unlocked the session. That
 * is enough to make the product real — you can write, read back, and build a
 * streak within a session — while keeping the initialise step dependency-free.
 *
 * The seam is clean, exactly like the key-minting seam in the README: swap the
 * Map below for a Supabase table (keyed by `kid`, or by a real user id once you
 * add accounts) and nothing above this file changes.
 */

export interface JournalEntry {
  id: string;
  /** Calendar day in YYYY-MM-DD, used for the streak. */
  day: string;
  /** The prompt the entry was written against. */
  prompt: string;
  body: string;
  /** Unix seconds. */
  createdAt: number;
}

const store = new Map<string, JournalEntry[]>();

let counter = 0;
function nextId(): string {
  counter += 1;
  return `e${counter.toString(36)}`;
}

export function dayString(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function getEntries(kid: string): JournalEntry[] {
  // Stored in insertion (chronological) order; newest-first is a reverse.
  // Reversing insertion order — rather than sorting on `createdAt`, which is
  // only second-granular — keeps ordering deterministic for same-second writes.
  return [...(store.get(kid) ?? [])].reverse();
}

export function addEntry(
  kid: string,
  input: { prompt: string; body: string },
  now: number = Date.now(),
): JournalEntry {
  const entry: JournalEntry = {
    id: nextId(),
    day: dayString(now),
    prompt: input.prompt.trim(),
    body: input.body.trim(),
    createdAt: Math.floor(now / 1000),
  };
  const existing = store.get(kid) ?? [];
  existing.push(entry);
  store.set(kid, existing);
  return entry;
}

/**
 * Accountability: how many consecutive days up to and including today have at
 * least one entry. Missing yesterday but writing today = a streak of 1.
 */
export function computeStreak(entries: JournalEntry[], now: number = Date.now()): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((e) => e.day));
  let streak = 0;
  const cursor = new Date(now);
  // Walk backwards day by day until we hit a gap.
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** The rotating daily prompts — the voice of the brand, one reframe at a time. */
export const DAILY_PROMPTS: readonly string[] = [
  "What did you do today because it was necessary, not because it was comfortable?",
  "Amor fati — name one thing you resisted today that you could choose to love instead.",
  "Where did you act despite fear? Where did fear win?",
  "What would the person you are becoming have done differently in the last 24 hours?",
  "Name the boulder you are pushing. Is the point the summit, or the pushing?",
  "What did you control today, and what did you waste energy trying to control?",
  "One virtue — courage, temperance, justice, wisdom — that you practised today, and how.",
] as const;

/** Deterministic prompt-of-the-day so the same day always shows the same prompt. */
export function promptForDay(day: string = dayString()): string {
  let hash = 0;
  for (let i = 0; i < day.length; i += 1) {
    hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  }
  return DAILY_PROMPTS[hash % DAILY_PROMPTS.length];
}

/**
 * The canned demo an unpaid visitor sees. Real business data never leaves the
 * server for a free request — this is all they ever get.
 */
export const DEMO_ENTRIES: readonly JournalEntry[] = [
  {
    id: "demo-1",
    day: "sample",
    prompt: "Where did you act despite fear? Where did fear win?",
    body:
      "Sent the email I'd been avoiding for a week. Fear won at the gym — talked myself out of the last round. Tomorrow the last round is non-negotiable.",
    createdAt: 0,
  },
  {
    id: "demo-2",
    day: "sample",
    prompt: "What did you control today, and what did you waste energy trying to control?",
    body:
      "Controlled: my morning, my training, my words in a hard conversation. Wasted: refreshing a reply that was never mine to hurry.",
    createdAt: 0,
  },
] as const;
