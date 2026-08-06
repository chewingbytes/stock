import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Point Prisma at the throwaway test database before any client is created.
// Without TEST_DATABASE_URL, database-backed suites are skipped (see dbTest.ts)
// so tests can never write into the production database.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Components call useRouter(); jsdom has no mounted App Router.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));
