import { NextResponse } from "next/server";
import { categoryTree } from "@/lib/data/locations";
import { isOsclassDebugEnabled } from "@/lib/osclass/env";

export const runtime = "nodejs";

export async function GET() {
  const result = await categoryTree();
  const body: Record<string, unknown> = {
    categories: result.items,
    source: result.source,
  };
  if (isOsclassDebugEnabled() && result.fallbackReason) {
    body.debug = { fallbackReason: result.fallbackReason };
  }
  return NextResponse.json(body);
}
