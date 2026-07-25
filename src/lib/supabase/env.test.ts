import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

describe("isSupabaseConfigured", () => {
  let originalUrl: string | undefined;
  let originalKey: string | undefined;

  beforeEach(() => {
    originalUrl = process.env[URL_KEY];
    originalKey = process.env[ANON_KEY];
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env[URL_KEY];
    else process.env[URL_KEY] = originalUrl;
    if (originalKey === undefined) delete process.env[ANON_KEY];
    else process.env[ANON_KEY] = originalKey;
  });

  it("is true with a real https URL and key", () => {
    process.env[URL_KEY] = "https://abc123.supabase.co";
    process.env[ANON_KEY] = "real-anon-key";
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("is false for the scaffold placeholder values", () => {
    process.env[URL_KEY] = "your_supabase_url_here";
    process.env[ANON_KEY] = "your_supabase_anon_key_here";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is false when the URL is missing", () => {
    delete process.env[URL_KEY];
    process.env[ANON_KEY] = "real-anon-key";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is false when the anon key is missing", () => {
    process.env[URL_KEY] = "https://abc123.supabase.co";
    delete process.env[ANON_KEY];
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("accepts a local http URL for the Supabase CLI stack", () => {
    process.env[URL_KEY] = "http://127.0.0.1:54321";
    process.env[ANON_KEY] = "local-anon-key";
    expect(isSupabaseConfigured()).toBe(true);
  });
});
