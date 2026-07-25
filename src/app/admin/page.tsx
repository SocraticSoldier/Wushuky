import { getAdminData } from "@/lib/data/admin";
import { SetupNotice } from "@/components/SetupNotice";
import { CreateClassForm } from "@/components/admin/CreateClassForm";
import { DeleteClassButton } from "@/components/admin/DeleteClassButton";
import { formatDateTime } from "@/lib/format";

export default async function AdminPage() {
  const { stats, upcomingClasses } = await getAdminData();

  const cards = [
    { label: "Members", value: stats.memberCount },
    { label: "Active memberships", value: stats.activeMemberCount },
    { label: "Upcoming classes", value: stats.upcomingClassCount },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <SetupNotice />

      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mt-2 text-foreground/70">
        Manage members, classes, and payments.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.1]"
          >
            <p className="text-sm text-foreground/60">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <CreateClassForm />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Upcoming schedule
          </h2>
        </div>
        {upcomingClasses.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">
            No classes scheduled. Add classes via Supabase or your admin tools.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.1]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/[.08] text-foreground/60 dark:border-white/[.1]">
                <tr>
                  <th className="px-5 py-3 font-medium">Class</th>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Instructor</th>
                  <th className="px-5 py-3 font-medium">Level</th>
                  <th className="px-5 py-3 font-medium">Capacity</th>
                  <th className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
                {upcomingClasses.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-medium">{c.title}</td>
                    <td className="px-5 py-3 text-foreground/70">
                      {formatDateTime(c.starts_at)}
                    </td>
                    <td className="px-5 py-3 text-foreground/70">
                      {c.instructor ?? "—"}
                    </td>
                    <td className="px-5 py-3 capitalize text-foreground/70">
                      {c.level}
                    </td>
                    <td className="px-5 py-3 text-foreground/70">{c.capacity}</td>
                    <td className="px-5 py-3 text-right">
                      <DeleteClassButton classId={c.id} title={c.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
