import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b4ff45]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">{title}</h1>
          {description ? <p className="mt-4 text-base leading-7 text-white/62">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function SurfacePanel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:p-7 ${className}`}>
      {title || action ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-xl font-semibold text-white">{title}</h2> : null}
            {subtitle ? <p className="mt-2 text-sm leading-6 text-white/56">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/6 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      {note ? <p className="mt-3 text-sm text-white/52">{note}</p> : null}
    </div>
  );
}

export function EmptyNotice({ message, tone = "default" }: { message: string; tone?: "default" | "error" | "success" }) {
  const toneClass =
    tone === "error"
      ? "border-rose-400/18 bg-rose-400/10 text-rose-100"
      : tone === "success"
        ? "border-[#b4ff45]/18 bg-[#b4ff45]/10 text-[#e8ffc6]"
        : "border-white/10 bg-white/5 text-white/62";

  return <div className={`rounded-[22px] border px-4 py-3 text-sm ${toneClass}`}>{message}</div>;
}

export function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[#071510] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/38">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function AccentButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-full bg-[#b4ff45] px-5 py-3 text-sm font-semibold text-[#062415] transition hover:bg-[#c6ff74] disabled:opacity-60 ${className}`}>{children}</button>;
}

export function GhostButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/8 ${className}`}>{children}</button>;
}
