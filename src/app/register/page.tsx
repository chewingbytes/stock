import type { Metadata } from "next";
import { AuthForm } from "../../components/AuthForm";

export const metadata: Metadata = {
  title: "Create account — Stock Screener",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
