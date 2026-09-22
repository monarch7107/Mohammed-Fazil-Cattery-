"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSend, ApiError } from "@/lib/admin/api";

/**
 * Sign-in flow:
 *  - Firebase configured → authenticate with the Firebase JS SDK (email +
 *    password) and post the resulting ID token to /api/auth/login, which
 *    verifies it server-side and issues the signed session cookie.
 *  - Otherwise → legacy POST with email + password (env-configured accounts).
 */
export function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/mode")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { firebase?: boolean } | null) => {
        if (!cancelled) setFirebaseReady(Boolean(payload?.firebase));
      })
      .catch(() => {
        if (!cancelled) setFirebaseReady(false);
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
      let idToken: string | undefined;

      if (firebaseReady) {
        const { getFirebaseClientApp } = await import("@/lib/firebase/client");
        const authModule = await import("firebase/auth");
        const app = await getFirebaseClientApp();
        const auth = authModule.getAuth(app);
        const credential = await authModule.signInWithEmailAndPassword(auth, email, password);
        idToken = await credential.user.getIdToken();
        // The session is carried by the server cookie; the client-side
        // Firebase session is no longer needed.
        await authModule.signOut(auth).catch(() => undefined);
      }

      await apiSend("/api/auth/login", "POST", { email, password, idToken });
      const destination =
        returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : "/admin/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      const firebaseMessage =
        typeof err === "object" && err !== null && "code" in err && typeof (err as { code?: unknown }).code === "string"
          ? (() => {
              const code = (err as { code: string }).code;
              if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
                return "Email or password is incorrect.";
              }
              if (code === "auth/too-many-requests") {
                return "Too many attempts. Please wait a few minutes and try again.";
              }
              if (code === "auth/network-request-failed") {
                return "Network error. Check your connection and try again.";
              }
              return null;
            })()
          : null;
      setError(
        firebaseMessage ??
          (err instanceof ApiError ? err.message : "Sign-in failed. Please try again.")
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
