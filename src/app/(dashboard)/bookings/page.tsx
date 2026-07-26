import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyBookings, type BookingWithClass } from "@/lib/data/bookings";
import { SetupNotice } from "@/components/SetupNotice";
import { BookButton } from "@/components/classes/BookButton";
import { formatDateTime } from "@/lib/format";

function BookingRow({
  booking,
  cancellable,
}: {
  booking: BookingWithClass;
  cancellable: boolean;
}) {
  const { klass } = booking;
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{klass.title}</p>
          <span className="shrink-0 rounded-full border border-black/[.12] px-2 py-0.5 text-xs capitalize text-foreground/70 dark:border-white/[.18]">
            {klass.level}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-foreground/60">
          {formatDateTime(klass.starts_at)}
          {klass.instructor ? ` · ${klass.instructor}` : ""}
        </p>
      </div>
      {cancellable ? (
        <BookButton classId={klass.id} isBooked isFull={false} />
      ) : (
        <span className="shrink-0 text-xs capitalize text-foreground/50">
          {booking.status}
        </span>
      )}
    </li>
  );
}

export default async function BookingsPage() {
  const user = await requireUser();
  const { upcoming, past } = await getMyBookings(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <SetupNotice />

      <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
      <p className="mt-2 text-foreground/70">
        Classes you&apos;ve booked, and the ones you&apos;ve already attended.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">
            You have no upcoming bookings.{" "}
            <Link href="/classes" className="font-medium underline">
              Browse classes
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-black/[.06] rounded-xl border border-black/[.08] dark:divide-white/[.08] dark:border-white/[.1]">
            {upcoming.map((booking) => (
              <BookingRow
                key={booking.bookingId}
                booking={booking}
                cancellable
              />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">History</h2>
          <ul className="mt-4 divide-y divide-black/[.06] rounded-xl border border-black/[.08] dark:divide-white/[.08] dark:border-white/[.1]">
            {past.map((booking) => (
              <BookingRow
                key={booking.bookingId}
                booking={booking}
                cancellable={false}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
