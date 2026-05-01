import { NextResponse } from "next/server";
import { searchListings } from "@/lib/data/listings";
import { isOsclassDebugEnabled } from "@/lib/osclass/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const city = url.searchParams.get("city") ?? undefined;
  const region = url.searchParams.get("region") ?? undefined;
  const page = numberParam(url.searchParams.get("page"));
  const pageSize = numberParam(url.searchParams.get("pageSize"));

  try {
    const result = await searchListings({ query: q, city, region, page, pageSize });
    const debug = isOsclassDebugEnabled() && result.fallbackReason
      ? { debug: { fallbackReason: result.fallbackReason } }
      : {};
    return NextResponse.json({
      listings: result.listings,
      source: result.source,
      ...debug,
    });
  } catch (err) {
    console.error("[/api/listings] search failed", err);
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}

function numberParam(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
