import { NextResponse } from "next/server";
import { listCities } from "@/lib/data/locations";
import { isOsclassDebugEnabled } from "@/lib/osclass/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const regionIdRaw = url.searchParams.get("regionId");
  const regionId = regionIdRaw && /^\d+$/.test(regionIdRaw) ? regionIdRaw : undefined;
  const result = await listCities({ regionId });
  const body: Record<string, unknown> = {
    cities: result.items,
    source: result.source,
  };
  if (isOsclassDebugEnabled() && result.fallbackReason) {
    body.debug = { fallbackReason: result.fallbackReason };
  }
  return NextResponse.json(body);
}
