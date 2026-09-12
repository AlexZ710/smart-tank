// S22: credential-scrubbing for error details. Connection errors may embed
// "user:password@host" text; nothing secret-bearing may leave the server in
// an API response (frozen security boundary).

export function scrubError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/:[^:@/\s]+@/g, ":***@").slice(0, 200);
}
