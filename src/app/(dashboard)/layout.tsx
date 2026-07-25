import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.1]">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Wushu Kai
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-foreground/80 hover:text-foreground">
            Overview
          </Link>
          <Link href="/admin" className="text-foreground/80 hover:text-foreground">
            Admin
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
