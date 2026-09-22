"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setBusy(false);
      router.push("/admin/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-navy/20 px-3 text-[13px] font-semibold text-navy/65 transition hover:border-brown hover:text-brown disabled:opacity-60 sm:px-4"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{busy ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
