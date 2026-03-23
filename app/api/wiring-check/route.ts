import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, string> = {};

  // Check Supabase connection (frontend anon key)
  try {
    const { error } = await getSupabase().from("persona").select("id").limit(1);
    results.supabase = error ? `FAIL: ${error.message}` : "OK";
  } catch (e: unknown) {
    results.supabase = `FAIL: ${e instanceof Error ? e.message : "unknown"}`;
  }

  // Check backend API connection
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  results.api_url_configured = apiUrl || "NOT SET";

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl.replace(/\/api\/?$/, "")}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      const body = await res.json();
      results.backend_health = body.status === "ok" ? "OK" : `UNEXPECTED: ${JSON.stringify(body)}`;
    } catch (e: unknown) {
      results.backend_health = `FAIL: ${e instanceof Error ? e.message : "unknown"}`;
    }
  } else {
    results.backend_health = "SKIP: no API URL configured";
  }

  return NextResponse.json(results);
}
