import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-lg tracking-[0.35em] text-marble transition-colors hover:text-gold-bright"
        >
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-8 text-sm text-marble-dim">
          <Link href="/#pillars" className="hidden transition-colors hover:text-marble sm:inline">
            The Pillars
          </Link>
          <Link href="/#origin" className="hidden transition-colors hover:text-marble sm:inline">
            The Origin
          </Link>
          <Link
            href="/journal"
            className="rounded-full border border-gold/40 px-4 py-1.5 text-gold transition-colors hover:border-gold hover:bg-gold/10"
          >
            The Journal
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-marble-dim sm:flex-row sm:items-center">
        <div>
          <span className="font-display tracking-[0.35em] text-marble">{BRAND.name}</span>
          <span className="ml-3 font-serif italic text-marble-dim">{BRAND.tagline}</span>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-marble-dim/70">
          Necessity, not resignation. Named for the goddess even the gods feared.
        </p>
      </div>
    </footer>
  );
}
