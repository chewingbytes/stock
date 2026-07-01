# Deploying to Vercel (with Neon Postgres)

This app uses Prisma. **SQLite cannot run on Vercel** (its filesystem is read-only
and ephemeral), so the database has been switched to **PostgreSQL**. The steps
below provision a free Neon Postgres database, seed it, and deploy the app.

Assumes the code is already pushed to a GitHub repo.

---

## 1. Create a Neon Postgres database

Either option works:

- **Via Vercel (recommended):** Vercel dashboard → your project (create it in
  step 3 first if you prefer) → **Storage** → **Create Database** → **Neon
  (Postgres)**. Vercel auto-adds the `DATABASE_URL` env var for you.
- **Via Neon directly:** sign up at <https://neon.tech>, create a project, and
  copy the **pooled** connection string (looks like
  `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`).

Use the **pooled** connection string for the app at runtime — serverless
functions open many short-lived connections.

## 2. Create the schema and seed the data (run locally, once)

The database starts empty. Point your local machine at Neon and load the schema
+ fixture data:

```bash
# In the project root, put the Neon URL in .env (this file is gitignored):
echo 'DATABASE_URL="postgresql://...pooler...?sslmode=require"' > .env

# Create all tables from prisma/schema.prisma (no migration files needed):
npx prisma db push

# Import fixtures and compute the derived metrics the screener reads:
npm run db:seed:all
```

> `db:seed:all` runs the fixture import **and** the metric recompute. The
> screener reads the `DerivedMetric` table, so both steps are required or results
> will come back empty.

To verify: `npx prisma studio` and confirm the `Stock` and `DerivedMetric`
tables have rows.

## 3. Import the project into Vercel

1. Vercel dashboard → **Add New… → Project** → import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build/output defaults —
   `package.json` already runs `prisma generate && next build`, and
   `postinstall` regenerates the Prisma client on every install.
3. **Environment Variables:** add `DATABASE_URL` = your Neon **pooled**
   connection string (skip this if Vercel added it for you in step 1). Apply to
   Production, Preview, and Development.
4. **Deploy.**

## 4. After deploy

- The app should load and return screen results immediately (data was seeded in
  step 2).
- To refresh data later, re-run `npm run db:seed:all` locally against the same
  `DATABASE_URL`, or run the Yahoo import (`npm run import:yahoo`) then
  `npm run metrics:recompute`.

---

## Notes & gotchas

- **Env var, not committed:** `.env` is gitignored (correct). `DATABASE_URL`
  must be set in Vercel's dashboard, not in the repo. See `.env.example` for the
  expected format.
- **Migrations:** the old SQLite migration was removed because its SQL is not
  Postgres-compatible. This setup uses `prisma db push` (schema-first). If you
  later want versioned migrations, run
  `npx prisma migrate dev --name init` against a Postgres database to generate
  Postgres migrations, and switch the Vercel build to `prisma migrate deploy`.
- **DB-integration tests:** the tests under `src/server/**` (screener, import,
  metrics) talk to a real database. Run them with a `DATABASE_URL` pointing at a
  disposable Postgres DB (a separate Neon branch, or local Postgres). The UI and
  domain tests (`src/app`, `src/components`, `src/domain`) need no database and
  run with `npm test`.
- **Lockfile warning:** the build may warn about a parent-directory
  `package-lock.json` at `/Users/bryanchew/package-lock.json`. It's harmless —
  Vercel only uploads this repo. You can delete that stray lockfile to silence
  it locally.
