import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Screener",
  description: "End-of-day stock screening for research candidates.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
