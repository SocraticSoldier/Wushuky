export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-foreground/70">
        Welcome back. Here&apos;s an overview of your training.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Active membership", value: "—" },
          { label: "Classes this month", value: "—" },
          { label: "Current rank", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.1]"
          >
            <p className="text-sm text-foreground/60">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
