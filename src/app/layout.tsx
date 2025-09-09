import type { Metadata } from "next";
import { GeistSans } from "@vercel/fonts/geist-sans";
import { GeistMono } from "@vercel/fonts/geist-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gift List Manager",
  description: "Create and share gift lists with family and friends",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
