import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI RPG Game",
  description: "Multiplayer RPG with AI DM",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <Providers>
          <header className="border-b border-indigo-500/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link href="/dashboard" className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                AETHER
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/lobby" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
                  Lobby
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
                  Dashboard
                </Link>
                <Link href="/messages" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
                  Messages
                </Link>
                <Link href="/account" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
                  Account
                </Link>
              </div>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
