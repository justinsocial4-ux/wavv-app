import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wavv",
  description: "Wavv – your creative workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <div className="text-lg font-semibold tracking-tight">
                <span className="text-indigo-400">Wavv</span>
              </div>
              <nav className="flex items-center gap-6 text-sm text-slate-400">
                <a
                  href="/"
                  className="transition hover:text-slate-100"
                >
                  Status
                </a>
                <a
                  href="/dashboard"
                  className="transition hover:text-slate-100"
                >
                  Dashboard
                </a>
                <a
                  href="/accounts"
                  className="transition hover:text-slate-100"
                >
                  Accounts
                </a>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Early preview
                </span>
              </nav>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 py-10">
              {children}
            </div>
          </main>

          <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
            © 2025 Wavv • Built by Jay
          </footer>
        </div>
      </body>
    </html>
  );
}
