import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.1]">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Wushu Kai
          </Link>
          <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
            Admin
          </span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-foreground/80 hover:text-foreground">
            Dashboard
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
