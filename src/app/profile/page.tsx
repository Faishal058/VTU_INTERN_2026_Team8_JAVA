"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/planning";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const typed = data as UserProfile;
        setProfile(typed);
        setFullName(typed.full_name ?? "");
        setPhone(typed.phone ?? "");
        setAvatarUrl(typed.avatar_url ?? "");
      } else {
        setFullName(user.user_metadata?.full_name ?? "");
      }
    }
    void loadProfile();
  }, [supabase]);

  async function saveProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.auth.updateUser({ data: { full_name: fullName } });
    const { error } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      full_name: fullName,
      phone,
      avatar_url: avatarUrl || null,
      role: profile?.role ?? "USER",
    });

    setMessage(error ? error.message : "Profile updated successfully.");
  }

  return (
    <main className="ww-auth-shell min-h-screen bg-[#04140f] text-white">
      <div className="ww-home__aurora" aria-hidden="true" />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-white/10 bg-white/6 p-7 shadow-[0_28px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b4ff45]">Profile</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">Manage your WealthWise identity</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/62">Update your name, contact details, and avatar so the rest of the dashboard reflects the same premium product theme.</p>
            </div>
            <button onClick={saveProfile} className="rounded-full bg-[#b4ff45] px-6 py-3 text-sm font-semibold text-[#062415] transition hover:bg-[#c6ff74]">Save profile</button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr,1.2fr]">
            <div className="rounded-[30px] border border-white/10 bg-[#071510] p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#b4ff45] text-2xl font-black text-[#062415]">
                {fullName.trim() ? fullName.trim().slice(0, 1).toUpperCase() : "W"}
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">{fullName || "Your profile"}</h2>
              <p className="mt-2 text-sm text-white/55">Role: {profile?.role ?? "USER"}</p>
              <p className="mt-6 text-sm leading-6 text-white/58">This profile is used across your account, dashboard shell, and future shared collaboration surfaces.</p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name" value={fullName} onChange={setFullName} />
                <Field label="Phone" value={phone} onChange={setPhone} />
                <Field label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} />
                <Field label="Role" value={profile?.role ?? "USER"} onChange={() => undefined} disabled />
              </div>
              {message ? <p className="ww-auth-alert ww-auth-alert--success mt-6">{message}</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/72">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="ww-auth-input disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
