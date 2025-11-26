// src/components/AuthGate.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AuthState = "loading" | "authed" | "guest";

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session?.user) {
        setState("authed");
      } else {
        setState("guest");
        if (pathname !== "/login") {
          router.replace("/login");
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-gray-400">Checking your session…</p>
      </main>
    );
  }

  if (state === "guest") {
    return null; // already redirecting to /login
  }

  return <>{children}</>;
}
