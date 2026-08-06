import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminUsers } from "../../components/AdminUsers";
import { requireAdmin } from "../../server/auth/session";

export const metadata: Metadata = {
  title: "User admin — Stock Screener",
};

// Always evaluate the session on the server; never serve a cached admin shell.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/");
  }

  return <AdminUsers currentUserId={admin.id} />;
}
