"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

const copy: Record<
  Mode,
  { title: string; subtitle: string; cta: string; altText: string; altHref: string; altLink: string }
> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to run screens and export results.",
    cta: "Sign in",
    altText: "New here?",
    altHref: "/register",
    altLink: "Create an account",
  },
  register: {
    title: "Create your account",
    subtitle: "Set up a login to start screening stocks.",
    cta: "Create account",
    altText: "Already have an account?",
    altHref: "/login",
    altLink: "Sign in",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const text = copy[mode];
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { email, password, name: name.trim() || undefined }
            : { email, password },
        ),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Honour ?from=... set by the middleware, but only for internal paths.
      const from = new URLSearchParams(window.location.search).get("from");
      const target = from && from.startsWith("/") ? from : "/";
      router.replace(target);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span className="brand-name">Screener</span>
        </div>

        <h1 className="auth-title" id="auth-title">
          {text.title}
        </h1>
        <p className="auth-subtitle">{text.subtitle}</p>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {isRegister ? (
            <label className="auth-field">
              <span>Name (optional)</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Investor"
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? "At least 8 characters" : "Your password"}
            />
          </label>

          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Please wait..." : text.cta}
          </button>
        </form>

        <p className="auth-alt">
          {text.altText}{" "}
          <Link href={text.altHref}>{text.altLink}</Link>
        </p>
      </section>
    </main>
  );
}
