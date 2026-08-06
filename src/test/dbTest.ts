import { describe } from "vitest";

/**
 * Integration tests that read and write real tables.
 *
 * They are skipped unless TEST_DATABASE_URL is set, so `npm test` can never
 * write fixture data into the production database. To run them, point at a
 * throwaway database:
 *
 *   TEST_DATABASE_URL="postgresql://.../screener_test" npm test
 *
 * src/test/setup.ts copies TEST_DATABASE_URL over DATABASE_URL before the
 * Prisma client is constructed.
 */
export const describeDb = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;
