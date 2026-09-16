import { Pool } from "pg";

// S27 hardening: managed PostgreSQL providers (Neon/Supabase/Vercel
// Postgres, any non-local host) must be reached over TLS. node-postgres
// does NOT parse libpq-style sslmode= parameters, so SSL is enabled here
// for every non-local DATABASE_URL. Local development (localhost/127.0.0.1/
// ::1, e.g. the docker-compose stack) stays unencrypted by design.
// The helper is exported (pure) so the decision is unit-testable.
export function isLocalDatabaseUrl(url: string): boolean {
  return /^postgres(?:ql)?:\/\/(?:[^@/]*@)?(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    url,
  );
}

let pool: Pool | undefined;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalDatabaseUrl(process.env.DATABASE_URL)
      ? undefined
      : { rejectUnauthorized: true },
  });
  return pool;
}
