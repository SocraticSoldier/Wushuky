"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseProfileInput } from "@/lib/validation/profile";

export type ProfileState = { error: string } | { success: string } | null;

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const parsed = parseProfileInput({
    fullName: formData.get("fullName"),
    belt: formData.get("belt"),
  });
  if (!parsed.ok) return { error: parsed.error };

  try {
    const supabase = await createClient();
    // Only these two columns are ever written. `role` is not user-editable and
    // the database rejects role changes from non-admins (migration 0003).
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.value.fullName,
        belt: parsed.value.belt,
      })
      .eq("id", user.id);
    if (error) return { error: error.message };
  } catch {
    return { error: "Could not save your profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "Profile saved." };
}
