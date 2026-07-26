import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, ClassRow } from "@/lib/supabase/types";

export interface BookingWithClass {
  bookingId: string;
  status: BookingStatus;
  bookedAt: string;
  klass: ClassRow;
}

export interface MyBookings {
  upcoming: BookingWithClass[];
  past: BookingWithClass[];
}

const EMPTY: MyBookings = { upcoming: [], past: [] };

/**
 * Splits a user's bookings into upcoming and past relative to `now`. Pure —
 * exported for unit testing.
 */
export function splitBookings(
  bookings: BookingWithClass[],
  now: Date,
): MyBookings {
  const upcoming: BookingWithClass[] = [];
  const past: BookingWithClass[] = [];

  for (const booking of bookings) {
    const startsAt = new Date(booking.klass.starts_at);
    if (startsAt.getTime() >= now.getTime()) upcoming.push(booking);
    else past.push(booking);
  }

  upcoming.sort(
    (a, b) =>
      new Date(a.klass.starts_at).getTime() -
      new Date(b.klass.starts_at).getTime(),
  );
  // Most recent first for history.
  past.sort(
    (a, b) =>
      new Date(b.klass.starts_at).getTime() -
      new Date(a.klass.starts_at).getTime(),
  );

  return { upcoming, past };
}

/**
 * Loads the signed-in user's active bookings with their class details. RLS
 * restricts the rows to the caller's own bookings. Degrades to empty on any
 * failure so the page still renders.
 */
export async function getMyBookings(userId: string): Promise<MyBookings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("id, status, created_at, classes(*)")
      .eq("user_id", userId)
      .neq("status", "canceled");

    type Joined = {
      id: string;
      status: BookingStatus;
      created_at: string;
      classes: ClassRow | null;
    };

    const rows = (data ?? []) as unknown as Joined[];

    const bookings: BookingWithClass[] = rows
      .filter((row): row is Joined & { classes: ClassRow } => row.classes !== null)
      .map((row) => ({
        bookingId: row.id,
        status: row.status,
        bookedAt: row.created_at,
        klass: row.classes,
      }));

    return splitBookings(bookings, new Date());
  } catch {
    return EMPTY;
  }
}
