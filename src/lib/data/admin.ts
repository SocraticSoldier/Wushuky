import { createClient } from "@/lib/supabase/server";
import type { ClassRow } from "@/lib/supabase/types";

export interface AdminStats {
  memberCount: number;
  activeMemberCount: number;
  upcomingClassCount: number;
}

export interface AdminData {
  stats: AdminStats;
  upcomingClasses: ClassRow[];
}

const EMPTY: AdminData = {
  stats: { memberCount: 0, activeMemberCount: 0, upcomingClassCount: 0 },
  upcomingClasses: [],
};

/**
 * Loads admin overview data. Requires admin RLS privileges to return full
 * counts; degrades to zeros/empties on any failure so the page still renders.
 */
export async function getAdminData(): Promise<AdminData> {
  try {
    const supabase = await createClient();
    const nowISO = new Date().toISOString();

    const [membersRes, activeRes, upcomingCountRes, classesRes] =
      await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("memberships")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("classes")
          .select("*", { count: "exact", head: true })
          .gte("starts_at", nowISO),
        supabase
          .from("classes")
          .select("*")
          .gte("starts_at", nowISO)
          .order("starts_at", { ascending: true })
          .limit(8),
      ]);

    return {
      stats: {
        memberCount: membersRes.count ?? 0,
        activeMemberCount: activeRes.count ?? 0,
        upcomingClassCount: upcomingCountRes.count ?? 0,
      },
      upcomingClasses: classesRes.data ?? [],
    };
  } catch {
    return EMPTY;
  }
}
