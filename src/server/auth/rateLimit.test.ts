import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, getClientKey, resetRateLimits } from "./rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests up to the limit", () => {
    const options = { limit: 3, windowSeconds: 60 };

    expect(checkRateLimit("a", options).allowed).toBe(true);
    expect(checkRateLimit("a", options).allowed).toBe(true);
    expect(checkRateLimit("a", options).allowed).toBe(true);
  });

  it("blocks once the limit is exceeded and reports a retry delay", () => {
    const options = { limit: 2, windowSeconds: 60 };

    checkRateLimit("b", options);
    checkRateLimit("b", options);
    const blocked = checkRateLimit("b", options);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks each key independently", () => {
    const options = { limit: 1, windowSeconds: 60 };

    expect(checkRateLimit("user-1", options).allowed).toBe(true);
    expect(checkRateLimit("user-1", options).allowed).toBe(false);
    expect(checkRateLimit("user-2", options).allowed).toBe(true);
  });
});

describe("getClientKey", () => {
  it("uses the first address in x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });

    expect(getClientKey(request, "login")).toBe("login:203.0.113.5");
  });

  it("falls back when the header is absent", () => {
    expect(getClientKey(new Request("https://example.com"), "login")).toBe(
      "login:unknown",
    );
  });
});
