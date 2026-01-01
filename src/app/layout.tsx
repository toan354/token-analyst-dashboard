import type { Metadata } from "next";
// import localFont from "next/font/local"; // Removing localFont for now, using System stack for speed, or add Google Font later.

import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className} suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
