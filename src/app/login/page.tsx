"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";

/**
 * LoginPage: Handles user authentication via Email/Password or Google OAuth.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  /**
   * Traditional Email/Password sign-in.
   */
  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Redirect to dashboard on success
    router.push("/dashboard");
  }

  /**
   * Google OAuth sign-in flow.
   */
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your WealthWise workspace"
      description="Pick up where you left off with your goals, SIP plans, analytics, and alerts in one consistent investing flow."
      footer={
        <p className="text-center text-sm text-white/55">
          Don&apos;t have an account? {" "}
          <Link href="/signup" className="font-semibold text-[#d8ff9a] transition hover:text-white">
            Sign up free
          </Link>
        </p>
      }
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#b4ff45]">Login</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Access your dashboard</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Use your email and password, or continue with Google.</p>
      </div>

      {/* Error message display */}
      {error ? <div className="ww-auth-alert ww-auth-alert--error">{error}</div> : null}

      <div className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" />

        <button onClick={handleLogin} disabled={loading} className="ww-auth-primary">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>

      <div className="mt-4 text-right text-sm">
        <Link href="/forgot-password" className="font-semibold text-[#d8ff9a] transition hover:text-white">
          Forgot password?
        </Link>
      </div>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/12" />
        <span className="text-xs uppercase tracking-[0.28em] text-white/35">or</span>
        <div className="h-px flex-1 bg-white/12" />
      </div>

      <button onClick={handleGoogle} className="ww-auth-secondary">
        Continue with Google
      </button>
    </AuthShell>
  );
}

/**
 * Reusable form field component for auth pages.
 */
function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/72">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="ww-auth-input"
      />
    </div>
  );
}

