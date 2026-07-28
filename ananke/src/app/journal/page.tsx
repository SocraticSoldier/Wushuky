import {
  computeStreak,
  DEMO_ENTRIES,
  getEntries,
  promptForDay,
} from "@/lib/journal-store";
import { getServerSession, getServerTier } from "@/lib/server-tier";
import { Paywall } from "@/components/Paywall";
import { JournalConsole, type JournalData } from "@/components/JournalConsole";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default async function JournalPage() {
  const tier = await getServerTier();

  // Build the paid journal data on the server, behind the same gate the API
  // uses. For a free visitor this stays an empty placeholder — the console is
  // never rendered for them anyway (the Paywall shows the key box instead).
  let data: JournalData = { prompt: promptForDay(), streak: 0, entries: [] };
  if (tier === "paid") {
    const session = await getServerSession();
    const entries = session ? getEntries(session.kid) : [];
    data = { prompt: promptForDay(), streak: computeStreak(entries), entries };
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.5em] text-marble-dim">
            Discipline &amp; Self-Development
          </p>
          <h1 className="font-display text-4xl tracking-wide text-marble sm:text-5xl">
            The <span className="gold">Journal</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-serif text-xl leading-relaxed text-marble-dim">
            One prompt a day, in the voice of the ancients. Write, and the streak
            keeps you honest.
          </p>
        </div>

        {/* Demo preview — the canned glimpse a free visitor gets. The real data
            only ever comes from the gate, never for an unpaid request. */}
        <section className="mb-14">
          <p className="mb-4 text-center font-sans text-xs uppercase tracking-[0.4em] text-gold/70">
            A glimpse
          </p>
          <p className="mx-auto mb-6 max-w-2xl text-center font-serif text-lg italic text-marble">
            &ldquo;{promptForDay()}&rdquo;
          </p>
          <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
            {DEMO_ENTRIES.map((entry) => (
              <article
                key={entry.id}
                className="rounded-lg border border-line bg-ink-raised/60 p-5"
              >
                <p className="font-serif text-sm italic text-marble-dim">
                  {entry.prompt}
                </p>
                <p className="mt-2 font-serif text-base leading-relaxed text-marble">
                  {entry.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="mx-auto mb-14 h-px w-24 thread" />

        <Paywall initialTier={tier}>
          <JournalConsole initialData={data} />
        </Paywall>
      </main>
      <SiteFooter />
    </>
  );
}
