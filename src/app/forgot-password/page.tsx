"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) setError(error.message);
    else setMessage("Password reset link sent. Check your email.");

    setLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Reset your password securely"
      description="Enter your email and we will send a reset link so you can re-enter your WealthWise account safely."
      footer={
        <p className="text-center text-sm text-white/55">
          Remembered it? {" "}
          <Link href="/login" className="font-semibold text-[#d8ff9a] transition hover:text-white">
            Back to login
          </Link>
        </p>
      }
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#b4ff45]">Forgot password</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Send reset instructions</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/72">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="ww-auth-input"
          />
        </div>
        <button onClick={handleReset} disabled={loading} className="ww-auth-primary">
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </div>
      {message ? <p className="ww-auth-alert ww-auth-alert--success mt-4">{message}</p> : null}
      {error ? <p className="ww-auth-alert ww-auth-alert--error mt-4">{error}</p> : null}
    </AuthShell>
  );
}
