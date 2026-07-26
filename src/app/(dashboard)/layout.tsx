import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative auth check (the Proxy redirect is only a fast path).
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.1]">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Wushu Kai
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/dashboard"
            className="text-foreground/80 hover:text-foreground"
          >
            Overview
          </Link>
          <Link
            href="/classes"
            className="text-foreground/80 hover:text-foreground"
          >
            Classes
          </Link>
          <Link
            href="/bookings"
            className="text-foreground/80 hover:text-foreground"
          >
            My bookings
          </Link>
          <Link
            href="/admin"
            className="text-foreground/80 hover:text-foreground"
          >
            Admin
          </Link>
          <Link
            href="/profile"
            className="hidden text-foreground/50 hover:text-foreground sm:inline"
          >
            {user.email}
          </Link>
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
