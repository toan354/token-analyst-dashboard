import type { Metadata } from "next";
// import localFont from "next/font/local"; // Removing localFont for now, using System stack for speed, or add Google Font later.
import "./globals.css";

export const metadata: Metadata = {
  title: "Analyst Terminal v6.1",
  description: "Advanced Crypto Analysis Framework by Google Deepmind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
