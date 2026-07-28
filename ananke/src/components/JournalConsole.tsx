"use client";

/**
 * The real journal. Its initial data is fetched on the SERVER (the /journal
 * page reads it behind the same gate) and handed in as `initialData`, so there
 * is no client fetch on mount. Saving an entry updates state from the POST
 * response — an event handler, not an effect. Locking calls router.refresh()
 * so the server re-renders as free.
 *
 * None of this is trusted: every write goes through /api/journal, which runs
 * requireTier("paid") on the server before it does anything.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JournalEntry } from "@/lib/journal-store";

export interface JournalData {
  prompt: string;
  streak: number;
  entries: JournalEntry[];
}

export function JournalConsole({ initialData }: { initialData: JournalData }) {
  const router = useRouter();
  const [state, setState] = useState<JournalData>(initialData);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: state.prompt, body }),
      });
      if (!res.ok) {
        setError(
          res.status === 402
            ? "Your session ended. Unlock again to continue."
            : "Couldn't save that entry. Try again.",
        );
        return;
      }
      setState((await res.json()) as JournalData);
      setBody("");
    } finally {
      setSaving(false);
    }
  }

  async function lock() {
    await fetch("/api/session", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Accountability header */}
      <div className="mb-8 flex items-end justify-between border-b border-line pb-6">
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.4em] text-marble-dim">
            Your streak
          </p>
          <p className="font-display text-4xl text-gold">
            {state.streak}
            <span className="ml-2 text-base text-marble-dim">
              {state.streak === 1 ? "day" : "days"}
            </span>
          </p>
        </div>
        <button
          onClick={lock}
          className="font-sans text-xs tracking-wide text-marble-dim underline-offset-4 hover:text-marble hover:underline"
        >
          Lock
        </button>
      </div>

      {/* Today's prompt + composer */}
      <form onSubmit={save} className="grain relative rounded-lg border border-line bg-ink-raised p-6">
        <p className="mb-1 font-sans text-xs uppercase tracking-[0.4em] text-gold">
          Today
        </p>
        <p className="font-serif text-xl leading-relaxed text-marble">
          {state.prompt}
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Write it plainly. No one is watching but you."
          className="mt-5 w-full resize-none rounded-md border border-line bg-ink px-4 py-3 font-serif text-lg leading-relaxed text-marble outline-none transition-colors focus:border-gold"
        />
        <div className="mt-3 flex items-center justify-between">
          {error && <span className="font-sans text-sm text-red-300/90">{error}</span>}
          <button
            type="submit"
            disabled={saving || body.trim().length === 0}
            className="ml-auto rounded-full bg-gold px-6 py-2.5 font-sans text-sm font-medium tracking-wide text-ink transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Commit today"}
          </button>
        </div>
      </form>

      {/* Past entries */}
      <div className="mt-10 space-y-6">
        {state.entries.length === 0 && (
          <p className="text-center font-serif italic text-marble-dim">
            Day one. Every practice starts here.
          </p>
        )}
        {state.entries.map((entry) => (
          <article key={entry.id} className="border-l border-gold/30 pl-5">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-marble-dim">
              {entry.day}
            </p>
            <p className="mt-1 font-serif text-base italic text-marble-dim">
              {entry.prompt}
            </p>
            <p className="mt-2 whitespace-pre-wrap font-serif text-lg leading-relaxed text-marble">
              {entry.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
