"use client";

/**
 * Wrap a paid feature. Free visitors see the key box; once they unlock, they
 * see the feature. This decides only what to SHOW.
 *
 * The tier is read on the SERVER (see lib/server-tier.ts) and passed in as
 * `initialTier`, so there's no client fetch and no free→paid flash. After a
 * successful unlock we call `router.refresh()`, which re-runs the server render
 * with the new cookie — the server, not this component, decides the new tier.
 * Forge `initialTier` in devtools all you like; `/api/journal` still gates you.
 */
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Tier } from "@/lib/tiers";

export function Paywall({
  initialTier,
  children,
}: {
  initialTier: Tier;
  children: ReactNode;
}) {
  const router = useRouter();
  if (initialTier === "paid") return <>{children}</>;
  return <KeyBox onUnlocked={() => router.refresh()} />;
}

function KeyBox({ onUnlocked }: { onUnlocked: () => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      if (!res.ok) {
        // The server gives one identical reason for every failure. So do we.
        setError("That key didn't work. Check it and try again.");
        return;
      }
      onUnlocked();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="grain relative rounded-lg border border-line bg-ink-raised p-8">
        <p className="mb-2 font-sans text-xs uppercase tracking-[0.4em] text-gold">
          Members
        </p>
        <h2 className="font-display text-2xl tracking-wide text-marble">
          Unlock the journal
        </h2>
        <p className="mt-3 font-serif text-lg leading-relaxed text-marble-dim">
          The free version is a demo. Enter your key to keep a real journal, a
          real streak, and everything you write.
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste your licence key"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-md border border-line bg-ink px-4 py-3 font-mono text-sm text-marble outline-none transition-colors focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy || key.trim().length === 0}
            className="rounded-full bg-gold px-6 py-3 font-sans text-sm font-medium tracking-wide text-ink transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Unlocking…" : "Unlock"}
          </button>
          {error && (
            <p className="font-sans text-sm text-red-300/90" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
      <p className="mt-4 text-center font-serif text-sm italic text-marble-dim/70">
        No key yet? This is the paid tier — keys are issued by hand for now.
      </p>
    </div>
  );
}
