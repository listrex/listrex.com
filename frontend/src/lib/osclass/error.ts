import { OsclassApiError } from "./client";
import { isOsclassDebugEnabled } from "./env";

/**
 * Build a JSON-serializable diagnostic object from any error.
 * Only included in responses when OSCLASS_DEBUG=1 is set on the server.
 */
export function describeError(err: unknown): Record<string, unknown> {
  if (err instanceof OsclassApiError) {
    return {
      kind: "OsclassApiError",
      upstreamStatus: err.status,
      upstreamBody: err.body.slice(0, 600),
    };
  }
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    const causeMessage =
      cause instanceof Error ? cause.message : typeof cause === "string" ? cause : undefined;
    return {
      kind: err.name || "Error",
      message: err.message,
      ...(causeMessage ? { cause: causeMessage } : {}),
    };
  }
  return { kind: "Unknown", message: String(err) };
}

export function maybeDebug(err: unknown): Record<string, unknown> {
  return isOsclassDebugEnabled() ? { debug: describeError(err) } : {};
}
