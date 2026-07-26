import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SetupNotice } from "@/components/SetupNotice";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Profile } from "@/lib/supabase/types";

async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div className="mx-auto max-w-xl">
      <SetupNotice />

      <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
      <p className="mt-2 text-foreground/70">
        Update how you appear across Wushu Kai.
      </p>

      <dl className="mt-6 rounded-xl border border-black/[.08] px-5 py-4 text-sm dark:border-white/[.1]">
        <div className="flex items-center justify-between">
          <dt className="text-foreground/60">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <dt className="text-foreground/60">Role</dt>
          <dd className="font-medium capitalize">{profile?.role ?? "member"}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <ProfileForm
          initialFullName={profile?.full_name ?? ""}
          initialBelt={profile?.belt ?? ""}
        />
      </div>
    </div>
  );
}
