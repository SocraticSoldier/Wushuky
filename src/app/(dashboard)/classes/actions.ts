"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type BookingResult = { ok: true } | { ok: false; error: string };

/** Book the current user into a class. Enforces capacity in the database. */
export async function bookClassAction(classId: string): Promise<BookingResult> {
  await requireUser();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("book_class", {
      p_class_id: classId,
    });
    if (error) return { ok: false, error: error.message };
    if (data === "full") return { ok: false, error: "This class is full." };
  } catch {
    return { ok: false, error: "Could not book right now. Please try again." };
  }

  revalidatePath("/classes");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Cancel the current user's booking for a class. */
export async function cancelBookingAction(
  classId: string,
): Promise<BookingResult> {
  await requireUser();

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("cancel_booking", {
      p_class_id: classId,
    });
    if (error) return { ok: false, error: error.message };
  } catch {
    return { ok: false, error: "Could not cancel right now. Please try again." };
  }

  revalidatePath("/classes");
  revalidatePath("/dashboard");
  return { ok: true };
}
