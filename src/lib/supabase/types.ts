/**
 * Database types for the Supabase schema (see supabase/migrations).
 *
 * Hand-maintained to mirror the SQL. If you connect the Supabase CLI you can
 * regenerate this file with:
 *   npx supabase gen types typescript --local > src/lib/supabase/types.ts
 */

export type MembershipStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export type ClassLevel = "all" | "beginner" | "intermediate" | "advanced";
export type BookingStatus = "booked" | "attended" | "canceled";
export type BillingInterval = "month" | "year";
export type UserRole = "member" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          belt: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
          belt?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: UserRole;
          belt?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      membership_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          currency: string;
          billing_interval: BillingInterval;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          billing_interval?: BillingInterval;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          billing_interval?: BillingInterval;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          status: MembershipStatus;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          status?: MembershipStatus;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string | null;
          status?: MembershipStatus;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          instructor: string | null;
          level: ClassLevel;
          starts_at: string;
          duration_minutes: number;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          instructor?: string | null;
          level?: ClassLevel;
          starts_at: string;
          duration_minutes?: number;
          capacity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          instructor?: string | null;
          level?: ClassLevel;
          starts_at?: string;
          duration_minutes?: number;
          capacity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          status: BookingStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          status?: BookingStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          status?: BookingStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      book_class: {
        Args: { p_class_id: string };
        Returns: string;
      };
      cancel_booking: {
        Args: { p_class_id: string };
        Returns: string;
      };
      class_booked_counts: {
        Args: Record<PropertyKey, never>;
        Returns: { class_id: string; booked_count: number }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

// Convenience row aliases.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MembershipPlan =
  Database["public"]["Tables"]["membership_plans"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
