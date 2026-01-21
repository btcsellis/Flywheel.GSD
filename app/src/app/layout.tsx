import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flywheel.GSD",
  description: "Work item management for parallel Claude Code sessions",
};

function Nav() {
  return (
    <nav className="border-b border-zinc-800 bg-[#0a0a0b]">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-zinc-100 tracking-tight"
            >
              FLYWHEEL
              <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-widest">
                GSD
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <NavLink href="/">Board</NavLink>
              <NavLink href="/archive">Archive</NavLink>
              <NavLink href="/new">+ New</NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 uppercase tracking-wider transition-colors"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} font-mono antialiased bg-[#0a0a0b] text-zinc-100 min-h-screen`}>
        <Nav />
        <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
