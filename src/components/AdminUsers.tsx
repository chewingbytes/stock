"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
};

export function AdminUsers({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // New-user form
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = (await response.json()) as { users?: AdminUser[]; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not load users.");
        return;
      }

      setUsers(data.users ?? []);
      setError(null);
    } catch {
      setError("Network error while loading users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          name: name.trim() || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not create the user.");
        return;
      }

      setEmail("");
      setName("");
      setPassword("");
      setRole("USER");
      await loadUsers();
    } catch {
      setError("Network error while creating the user.");
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(user: AdminUser) {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    setBusyId(user.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not update the role.");
        return;
      }

      await loadUsers();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (
      !window.confirm(
        `Delete ${user.email}? This permanently removes their account.`,
      )
    ) {
      return;
    }

    setBusyId(user.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not delete the user.");
        return;
      }

      await loadUsers();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero admin-hero">
        <div>
          <h1>User administration</h1>
          <p className="hero-lead">
            Add, promote, and remove accounts that can access the screener.
          </p>
        </div>
        <Link className="secondary-button" href="/">
          Back to screener
        </Link>
      </header>

      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Accounts</p>
            <h2>Add a user</h2>
          </div>
        </div>

        <form className="admin-create-form" onSubmit={createUser}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
            />
          </label>
          <label className="auth-field">
            <span>Name (optional)</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Investor"
            />
          </label>
          <label className="auth-field">
            <span>Temporary password</span>
            <input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          <label className="auth-field">
            <span>Role</span>
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "USER" | "ADMIN")
              }
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <button className="primary" type="submit" disabled={creating}>
            {creating ? "Adding..." : "Add user"}
          </button>
        </form>
      </section>

      <section className="panel table-panel">
        <div className="table-panel-title">
          <h2>All users</h2>
          <span className="result-count">
            {users.length} {users.length === 1 ? "account" : "accounts"}
          </span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Created</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.email}
                      {user.id === currentUserId ? (
                        <span className="quality">You</span>
                      ) : null}
                    </td>
                    <td>{user.name ?? "—"}</td>
                    <td>
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "quality quality-complete"
                            : "quality"
                        }
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => changeRole(user)}
                          disabled={busyId === user.id}
                        >
                          {user.role === "ADMIN" ? "Make user" : "Make admin"}
                        </button>
                        <button
                          className="secondary-button danger-button"
                          type="button"
                          onClick={() => deleteUser(user)}
                          disabled={busyId === user.id || user.id === currentUserId}
                          title={
                            user.id === currentUserId
                              ? "You cannot delete your own account"
                              : undefined
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
