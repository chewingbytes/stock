"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AccountMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: { email?: string } | null }) => {
        if (active) {
          setEmail(data.user?.email ?? null);
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
