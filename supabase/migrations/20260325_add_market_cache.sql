create table if not exists public.fund_master_cache (
  scheme_code text primary key,
  scheme_name text not null,
  fund_house text not null,
  category text,
  nav numeric(12,4),
  nav_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  value numeric(14,4),
  change_pct numeric(8,4),
  captured_at timestamptz not null default now()
);

grant select, insert, update on public.fund_master_cache to anon, authenticated;
grant select, insert, update on public.market_snapshots to anon, authenticated;
