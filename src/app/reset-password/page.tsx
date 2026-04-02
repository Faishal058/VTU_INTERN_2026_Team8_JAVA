"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/login");
  }

  return (
    <AuthShell
      eyebrow="Password update"
      title="Choose a new password"
      description="Set a strong password and continue into the same WealthWise dashboard experience without losing your account flow."
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#b4ff45]">Reset password</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Create a fresh password</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/72">New password</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" className="ww-auth-input" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/72">Confirm password</label>
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" className="ww-auth-input" />
        </div>
        <button onClick={handleUpdate} disabled={loading} className="ww-auth-primary">{loading ? "Updating..." : "Update password"}</button>
      </div>
      {error ? <p className="ww-auth-alert ww-auth-alert--error mt-4">{error}</p> : null}
    </AuthShell>
  );
}
