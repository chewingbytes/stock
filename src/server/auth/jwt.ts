import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Name of the httpOnly cookie that stores the signed session token.
// Kept here (in the only Edge-safe auth module) so both middleware and
// server code can share it without pulling in Node-only dependencies.
export const SESSION_COOKIE = "session";

// Token lifetime. Keep in sync with the cookie maxAge in session.ts.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionClaims = JWTPayload & {
  sub: string;
  email: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a strong random value (>= 32 chars).",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(claims: {
  sub: string;
  email: string;
}): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, getSecret());

  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Malformed session token.");
  }

  return payload as SessionClaims;
}
