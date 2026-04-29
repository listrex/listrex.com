import { NextResponse } from "next/server";
import { getListing } from "@/lib/data/listings";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const listing = await getListing(slug);
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ listing });
  } catch (err) {
    console.error("[/api/listings/:slug] failed", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
  }
}
