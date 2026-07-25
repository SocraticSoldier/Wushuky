import { requireUser } from "@/lib/auth";
import { getUpcomingClassesWithState } from "@/lib/data/classes";
import { SetupNotice } from "@/components/SetupNotice";
import { BookButton } from "@/components/classes/BookButton";
import { formatDateTime } from "@/lib/format";

export default async function ClassesPage() {
  const user = await requireUser();
  const classes = await getUpcomingClassesWithState(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <SetupNotice />

      <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
      <p className="mt-2 text-foreground/70">
        Book your spot in an upcoming class.
      </p>

      {classes.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/60">
          No upcoming classes scheduled yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-black/[.06] rounded-xl border border-black/[.08] dark:divide-white/[.08] dark:border-white/[.1]">
          {classes.map((c) => {
            const isFull = c.spotsLeft <= 0;
            return (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{c.title}</p>
                    <span className="shrink-0 rounded-full border border-black/[.12] px-2 py-0.5 text-xs capitalize text-foreground/70 dark:border-white/[.18]">
                      {c.level}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/60">
                    {formatDateTime(c.starts_at)}
                    {c.instructor ? ` · ${c.instructor}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    {isFull
                      ? "Fully booked"
                      : `${c.spotsLeft} of ${c.capacity} spots left`}
                    {c.isBooked ? " · You're booked" : ""}
                  </p>
                </div>
                <BookButton
                  classId={c.id}
                  isBooked={c.isBooked}
                  isFull={isFull}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
