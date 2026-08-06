import { cookies } from "next/headers";
import { prisma } from "../db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "./jwt";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role?: "USER" | "ADMIN";
};

/**
 * Signs a JWT for the user and writes it as an httpOnly cookie.
 * Call from Route Handlers / Server Actions only.
 */
export async function createSession(user: SessionUser): Promise<void> {
  const token = await signSessionToken({ sub: user.id, email: user.email });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Resolves the signed-in user from the session cookie, or null.
 * Verifies the JWT signature and confirms the user still exists.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const claims = await verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, name: true, role: true },
    });

    return user;
  } catch {
    return null;
  }
}

/**
 * Resolves the current user and asserts they are an admin.
 * Returns null when not signed in or not an admin, so callers can 401/403.
 */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}
