import { NextResponse } from "next/server";

// Open on purpose — a liveness probe, no tier required.
export function GET() {
  return NextResponse.json({ ok: true, service: "ananke" });
}
