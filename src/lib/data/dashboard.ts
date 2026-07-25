import { createClient } from "@/lib/supabase/server";
import type { ClassRow, Profile } from "@/lib/supabase/types";

export interface DashboardMembership {
  status: string;
  planName: string | null;
  currentPeriodEnd: string | null;
}

export interface DashboardData {
  profile: Profile | null;
  membership: DashboardMembership | null;
  monthlyBookings: number;
  upcomingClasses: ClassRow[];
}

const EMPTY: DashboardData = {
  profile: null,
  membership: null,
  monthlyBookings: 0,
  upcomingClasses: [],
};

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/**
 * Loads everything the dashboard needs for a user in parallel. Any failure
 * (unconfigured project, network, RLS) degrades to safe empty defaults so the
 * page always renders.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    const supabase = await createClient();
    const nowISO = new Date().toISOString();

    const [profileRes, membershipRes, bookingsRes, classesRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("memberships")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfMonthISO()),
        supabase
          .from("classes")
          .select("*")
          .gte("starts_at", nowISO)
          .order("starts_at", { ascending: true })
          .limit(5),
      ]);

    let membership: DashboardMembership | null = null;
    if (membershipRes.data) {
      let planName: string | null = null;
      if (membershipRes.data.plan_id) {
        const planRes = await supabase
          .from("membership_plans")
          .select("name")
          .eq("id", membershipRes.data.plan_id)
          .maybeSingle();
        planName = planRes.data?.name ?? null;
      }
      membership = {
        status: membershipRes.data.status,
        planName,
        currentPeriodEnd: membershipRes.data.current_period_end,
      };
    }

    return {
      profile: profileRes.data ?? null,
      membership,
      monthlyBookings: bookingsRes.count ?? 0,
      upcomingClasses: classesRes.data ?? [],
    };
  } catch {
    return EMPTY;
  }
}
