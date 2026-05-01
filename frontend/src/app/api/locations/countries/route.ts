import { NextResponse } from "next/server";
import { listCountries } from "@/lib/data/locations";
import { isOsclassDebugEnabled } from "@/lib/osclass/env";

export const runtime = "nodejs";

export async function GET() {
  const result = await listCountries();
  const body: Record<string, unknown> = {
    countries: result.items,
    source: result.source,
  };
  if (isOsclassDebugEnabled() && result.fallbackReason) {
    body.debug = { fallbackReason: result.fallbackReason };
  }
  return NextResponse.json(body);
}
