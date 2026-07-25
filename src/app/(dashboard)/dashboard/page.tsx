import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { SetupNotice } from "@/components/SetupNotice";
import { formatDateTime, titleCase } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const { profile, membership, monthlyBookings, upcomingClasses } =
    await getDashboardData(user.id);

  const greetingName = profile?.full_name ?? user.email ?? "there";

  const stats = [
    {
      label: "Active membership",
      value: membership?.planName ?? membership?.status ?? "None",
      hint: membership ? titleCase(membership.status) : "No active plan",
    },
    {
      label: "Classes this month",
      value: String(monthlyBookings),
      hint: "Bookings since the 1st",
    },
    {
      label: "Current rank",
      value: profile?.belt ?? "—",
      hint: "Your belt / grade",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <SetupNotice />

      <h1 className="text-2xl font-bold tracking-tight">
        Welcome back, {greetingName}
      </h1>
      <p className="mt-2 text-foreground/70">Here&apos;s your training overview.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.1]"
          >
            <p className="text-sm text-foreground/60">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-foreground/50">{stat.hint}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Upcoming classes
          </h2>
          <Link
            href="/classes"
            className="text-sm font-medium text-foreground/70 underline hover:text-foreground"
          >
            Book classes
          </Link>
        </div>
        {upcomingClasses.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">
            No upcoming classes scheduled yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-black/[.06] rounded-xl border border-black/[.08] dark:divide-white/[.08] dark:border-white/[.1]">
            {upcomingClasses.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-foreground/60">
                    {formatDateTime(c.starts_at)}
                    {c.instructor ? ` · ${c.instructor}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-black/[.12] px-2.5 py-0.5 text-xs capitalize text-foreground/70 dark:border-white/[.18]">
                  {c.level}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
