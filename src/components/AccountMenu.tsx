"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AccountMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: { email?: string; role?: string } | null }) => {
        if (active) {
          setEmail(data.user?.email ?? null);
          setIsAdmin(data.user?.role === "ADMIN");
        }
      })
      .catch(() => {
        /* ignore — menu just renders without an email */
      });

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="account-menu">
      {email ? (
        <span className="account-email" title={email}>
          {email}
        </span>
      ) : null}
      {isAdmin ? (
        <Link className="secondary-button" href="/admin">
          Admin
        </Link>
      ) : null}
      <button
        className="secondary-button"
        type="button"
        onClick={signOut}
        disabled={signingOut}
      >
        {signingOut ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
