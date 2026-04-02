"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSignup() {
    setLoading(true);
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <AuthShell
        eyebrow="Account created"
        title="Check your email to continue"
        description="We sent a confirmation link so you can activate your WealthWise account and enter the product flow securely."
        footer={
          <p className="text-center text-sm text-white/55">
            Already confirmed? {" "}
            <Link href="/login" className="font-semibold text-[#d8ff9a] transition hover:text-white">
              Back to login
            </Link>
          </p>
        }
      >
        <div className="rounded-[30px] border border-[#b4ff45]/20 bg-[#b4ff45]/10 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b4ff45] text-2xl font-black text-[#062415]">
            WW
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-white">Verification sent</h2>
          <p className="mt-3 text-base leading-7 text-white/65">
            We sent a confirmation link to <span className="font-semibold text-white">{email}</span>. Open it to activate your account.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Start free"
      title="Create your WealthWise account"
      description="Set up your profile, connect your first goals, and step into the same dark premium interface used across the full product."
      footer={
        <p className="text-center text-sm text-white/55">
          Already have an account? {" "}
          <Link href="/login" className="font-semibold text-[#d8ff9a] transition hover:text-white">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#b4ff45]">Signup</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Build your investing workspace</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Your account unlocks goals, investments, analytics, reports, and alerts.</p>
      </div>

      {error ? <div className="ww-auth-alert ww-auth-alert--error">{error}</div> : null}

      <div className="space-y-4">
        <Field label="Full name" type="text" value={fullName} onChange={setFullName} placeholder="Rahul Sharma" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" />

        <button onClick={handleSignup} disabled={loading} className="ww-auth-primary">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </AuthShell>
  );
}

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
