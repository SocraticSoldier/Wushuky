import Link from "next/link";
import { BRAND, PILLARS } from "@/lib/brand";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function Home() {
  return (
    <>
      <SiteHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="grain relative overflow-hidden">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-28 pt-24 text-center sm:pt-32">
          <p className="mb-6 font-sans text-xs uppercase tracking-[0.5em] text-marble-dim">
            {BRAND.tagline}
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-marble sm:text-7xl">
            You stopped waiting
            <br />
            to feel <span className="gold">ready</span>.
          </h1>
          <p className="mt-8 max-w-xl font-serif text-xl leading-relaxed text-marble-dim sm:text-2xl">
            The ideas that outlived the men who wrote them — philosophy,
            mythology and discipline — turned into a practice you can hold in
            your hands before noon.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/journal"
              className="rounded-full bg-gold px-8 py-3 font-sans text-sm font-medium tracking-wide text-ink transition-colors hover:bg-gold-bright"
            >
              Begin the journal
            </Link>
            <Link
              href="#pillars"
              className="font-sans text-sm tracking-wide text-marble-dim underline-offset-8 transition-colors hover:text-marble hover:underline"
            >
              What we stand for
            </Link>
          </div>
        </div>
        <div className="mx-auto h-px w-40 thread" />
      </section>

      {/* ── Pillars ──────────────────────────────────────────────────────── */}
      <section id="pillars" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl tracking-wide text-marble sm:text-4xl">
            Five <span className="gold">pillars</span>
          </h2>
          <p className="mt-4 font-serif text-lg italic text-marble-dim">
            One voice, told five ways.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <article
              key={pillar.slug}
              className="grain relative flex flex-col gap-3 bg-ink-raised p-8"
            >
              <span className="font-display text-sm text-gold/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-xl tracking-wide text-marble">
                {pillar.title}
              </h3>
              <p className="font-serif text-lg leading-relaxed text-marble-dim">
                {pillar.line}
              </p>
            </article>
          ))}
          <article className="flex flex-col justify-center gap-4 bg-ink-raised p-8">
            <p className="font-serif text-lg italic leading-relaxed text-marble">
              &ldquo;Read this on the days it&rsquo;s hard.&rdquo;
            </p>
            <Link
              href="/journal"
              className="font-sans text-sm tracking-wide text-gold underline-offset-8 hover:underline"
            >
              Start today &rarr;
            </Link>
          </article>
        </div>
      </section>

      {/* ── Origin ───────────────────────────────────────────────────────── */}
      <section id="origin" className="relative border-y border-line">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="mb-6 font-sans text-xs uppercase tracking-[0.5em] text-marble-dim">
            The gods feared one thing
          </p>
          <blockquote className="font-serif text-2xl leading-relaxed text-marble sm:text-3xl">
            {BRAND.origin}
          </blockquote>
          <div className="mx-auto mt-10 h-px w-24 thread" />
          <p className="mt-10 font-display tracking-[0.35em] text-gold">
            {BRAND.name}
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl leading-tight tracking-wide text-marble sm:text-4xl">
          What 30 days of <span className="gold">showing up</span>
          <br />
          actually looks like.
        </h2>
        <p className="mt-6 font-serif text-xl leading-relaxed text-marble-dim">
          One prompt a day. A streak you can&rsquo;t argue with. The journal is
          the practice — free to try, yours in full when you unlock it.
        </p>
        <Link
          href="/journal"
          className="mt-10 inline-block rounded-full bg-gold px-8 py-3 font-sans text-sm font-medium tracking-wide text-ink transition-colors hover:bg-gold-bright"
        >
          Open the journal
        </Link>
      </section>

      <SiteFooter />
    </>
  );
}
