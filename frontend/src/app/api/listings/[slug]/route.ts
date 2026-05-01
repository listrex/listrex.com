import { NextResponse } from "next/server";
import { getListing } from "@/lib/data/listings";
import { isOsclassDebugEnabled } from "@/lib/osclass/env";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const result = await getListing(slug);
    if (!result.listing) {
      return NextResponse.json({ error: "Not found", source: result.source }, { status: 404 });
    }
    const debug = isOsclassDebugEnabled() && result.fallbackReason
      ? { debug: { fallbackReason: result.fallbackReason } }
      : {};
    return NextResponse.json({
      listing: result.listing,
      source: result.source,
      ...debug,
    });
  } catch (err) {
    console.error("[/api/listings/:slug] failed", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
  }
}
