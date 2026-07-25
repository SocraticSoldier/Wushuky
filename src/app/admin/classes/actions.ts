"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseClassInput } from "@/lib/validation/class";

export type AdminClassState = { error: string } | { success: string } | null;

function revalidateClassViews() {
  revalidatePath("/admin");
  revalidatePath("/classes");
  revalidatePath("/dashboard");
}

/**
 * Creates a class. Admin-only: `requireAdmin()` re-verifies on the server, and
 * the `classes_admin_write` RLS policy is the second line of defence.
 */
export async function createClassAction(
  _prevState: AdminClassState,
  formData: FormData,
): Promise<AdminClassState> {
  await requireAdmin();

  const parsed = parseClassInput({
    title: formData.get("title"),
    instructor: formData.get("instructor"),
    level: formData.get("level"),
    startsAt: formData.get("startsAt"),
    durationMinutes: formData.get("durationMinutes"),
    capacity: formData.get("capacity"),
  });

  if (!parsed.ok) return { error: parsed.error };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("classes").insert({
      title: parsed.value.title,
      instructor: parsed.value.instructor,
      level: parsed.value.level,
      starts_at: parsed.value.startsAt,
      duration_minutes: parsed.value.durationMinutes,
      capacity: parsed.value.capacity,
    });
    if (error) return { error: error.message };
  } catch {
    return { error: "Could not create the class. Please try again." };
  }

  revalidateClassViews();
  return { success: `“${parsed.value.title}” was scheduled.` };
}

/** Deletes a class (cascades to its bookings). Admin-only. */
export async function deleteClassAction(
  classId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("classes").delete().eq("id", classId);
    if (error) return { ok: false, error: error.message };
  } catch {
    return { ok: false, error: "Could not delete the class." };
  }

  revalidateClassViews();
  return { ok: true };
}
