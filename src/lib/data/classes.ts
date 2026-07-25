import { createClient } from "@/lib/supabase/server";
import type { ClassRow } from "@/lib/supabase/types";

export interface ClassWithBookingState extends ClassRow {
  bookedCount: number;
  spotsLeft: number;
  isBooked: boolean;
}

/**
 * Combines raw class rows with aggregate booked counts and the current user's
 * bookings. Pure — exported for unit testing.
 */
export function annotateClasses(
  classes: ClassRow[],
  counts: { class_id: string; booked_count: number }[],
  myBookedClassIds: string[],
): ClassWithBookingState[] {
  const countByClass = new Map<string, number>();
  for (const row of counts) {
    countByClass.set(row.class_id, Number(row.booked_count));
  }
  const bookedByUser = new Set(myBookedClassIds);

  return classes.map((c) => {
    const bookedCount = countByClass.get(c.id) ?? 0;
    return {
      ...c,
      bookedCount,
      spotsLeft: Math.max(0, c.capacity - bookedCount),
      isBooked: bookedByUser.has(c.id),
    };
  });
}

/**
 * Upcoming classes annotated with live availability and whether the given user
 * is booked. Booked counts come from the `class_booked_counts` RPC (aggregate,
 * so it doesn't leak individual bookings under RLS); the user's own bookings
 * are read directly (RLS permits own rows). Degrades to `[]` on any failure.
 */
export async function getUpcomingClassesWithState(
  userId: string,
): Promise<ClassWithBookingState[]> {
  try {
    const supabase = await createClient();
    const nowISO = new Date().toISOString();

    const [classesRes, countsRes, myBookingsRes] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .gte("starts_at", nowISO)
        .order("starts_at", { ascending: true })
        .limit(50),
      supabase.rpc("class_booked_counts"),
      supabase
        .from("bookings")
        .select("class_id, status")
        .eq("user_id", userId)
        .neq("status", "canceled"),
    ]);

    return annotateClasses(
      classesRes.data ?? [],
      countsRes.data ?? [],
      (myBookingsRes.data ?? []).map((b) => b.class_id),
    );
  } catch {
    return [];
  }
}
