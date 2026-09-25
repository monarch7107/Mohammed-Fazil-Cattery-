"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSend, ApiError } from "@/lib/admin/api";

/**
 * Sign-in flow (Supabase Auth, publishable key only):
 *  1. Sign in with the Supabase JS SDK — @supabase/ssr stores the session
 *     in browser cookies automatically.
 *  2. POST /api/auth/login with no credentials in the body: the server reads
 *     the same cookies, verifies the session with the publishable key,
 *     checks the identity-based `admins` authorization, and issues the
 *     signed httpOnly app session cookie.
 */
export function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/mode")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { supabase?: boolean } | null) => {
        if (!cancelled) setSupabaseReady(Boolean(payload?.supabase));
      })
      .catch(() => {
        if (!cancelled) setSupabaseReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Authentication is not configured. Contact the site owner.");
        setBusy(false);
        return;
      }

      // 1. Sign in with Supabase Auth. @supabase/ssr persists the session in
      //    browser cookies automatically — the login request forwards them.
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError || !data.session) {
        const code = authError?.name ?? authError?.code ?? "";
        setError(
          code === "AuthApiError" || code === "invalid_credentials"
            ? "Email or password is incorrect."
            : authError?.message ?? "Sign-in failed. Please try again."
        );
        setBusy(false);
        return;
      }

      // 2. Exchange the cookie-carried session for the app's signed session
      //    cookie. The body carries no identity — the server reads it from
      //    the cookies and re-checks the identity-based admin authorization.
      await apiSend("/api/auth/login", "POST", { email, password });

      const destination =
        returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : "/admin/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Sign-in failed. Please try again."
      );
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password">Password</Label>
        <div className="relative">
          <Input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-navy/50 transition hover:bg-navy/8 hover:text-navy"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-brown/30 bg-brown/8 px-4 py-3 text-sm text-brown"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
