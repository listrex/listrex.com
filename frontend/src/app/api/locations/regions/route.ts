import { NextResponse } from "next/server";
import { listRegions } from "@/lib/data/locations";
import { isOsclassDebugEnabled } from "@/lib/osclass/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryCode = url.searchParams.get("countryCode") ?? undefined;
  const result = await listRegions({ countryCode });
  const body: Record<string, unknown> = {
    regions: result.items,
    source: result.source,
  };
  if (isOsclassDebugEnabled() && result.fallbackReason) {
    body.debug = { fallbackReason: result.fallbackReason };
  }
  return NextResponse.json(body);
}
