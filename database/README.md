# Local PostgreSQL
1. `docker compose up -d postgres`
2. Confirm `docker compose ps`.
3. Apply schema with your preferred PostgreSQL client against `DATABASE_URL` using `database/schema.sql`.
4. Never commit production credentials.
