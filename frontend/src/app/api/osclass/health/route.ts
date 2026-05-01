import { NextResponse } from "next/server";
import { getOsclassConfig, isOsclassDebugEnabled } from "@/lib/osclass/env";
import { osclass, OsclassApiError } from "@/lib/osclass/client";
import { describeError } from "@/lib/osclass/error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostics endpoint: returns whether Osclass is configured, what host
 * the configured URL points at (no key leakage), and the result of one
 * minimal `listItems` call. Detailed upstream body is only included when
 * OSCLASS_DEBUG=1 is set on the server.
 *
 * Safe to expose: never returns the API key, and only echoes the
 * configured host/protocol, not the full URL or query.
 */
export async function GET() {
  const cfg = getOsclassConfig();
  const debug = isOsclassDebugEnabled();

  if (!cfg) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "OSCLASS_API_BASE_URL and/or OSCLASS_API_KEY are not set on the server. The app is using mock data.",
      },
      { status: 200 }
    );
  }

  let host: string | undefined;
  let protocol: string | undefined;
  let parseOk = true;
  try {
    const u = new URL(cfg.baseUrl);
    host = u.host;
    protocol = u.protocol.replace(":", "");
  } catch {
    parseOk = false;
  }

  const meta = {
    configured: true,
    parseOk,
    host,
    protocol,
    pageSize: cfg.pageSize,
    defaultCategoryId: cfg.defaultCategoryId,
    apiKeyLength: cfg.apiKey.length,
    debugMode: debug,
  };

  const started = Date.now();
  try {
    const items = await osclass.listItems({ pageSize: 1 });
    return NextResponse.json({
      ...meta,
      ok: true,
      durationMs: Date.now() - started,
      itemsReturned: items.length,
      sampleKeys:
        items[0] && typeof items[0] === "object"
          ? Object.keys(items[0] as object).slice(0, 25)
          : [],
    });
  } catch (err) {
    const desc = describeError(err);
    const status = err instanceof OsclassApiError ? err.status : undefined;
    return NextResponse.json(
      {
        ...meta,
        ok: false,
        durationMs: Date.now() - started,
        upstreamStatus: status,
        ...(debug ? { debug: desc } : { error: typeof desc.message === "string" ? desc.message : desc.kind }),
      },
      { status: 502 }
    );
  }
}
