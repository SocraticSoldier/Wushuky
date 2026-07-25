export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mt-2 text-foreground/70">
        Manage members, classes, and payments.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Members", description: "View and manage member accounts." },
          { label: "Classes", description: "Schedule and edit class sessions." },
          { label: "Payments", description: "Review subscriptions and invoices." },
        ].map((section) => (
          <div
            key={section.label}
            className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.1]"
          >
            <p className="font-medium">{section.label}</p>
            <p className="mt-1 text-sm text-foreground/60">
              {section.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
