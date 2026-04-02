create extension if not exists pgcrypto;

create table if not exists public.investment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fund_name text not null,
  amc text not null,
  category text not null,
  investment_mode text not null check (investment_mode in ('SIP', 'Lumpsum')),
  amount numeric(14,2) not null check (amount > 0),
  frequency text not null,
  start_date date,
  note text,
  risk_profile text not null default 'Moderate',
  created_at timestamptz not null default now()
);

create index if not exists investment_plans_user_id_idx
  on public.investment_plans (user_id, created_at desc);

alter table public.investment_plans enable row level security;

create policy "investment plans select own"
  on public.investment_plans
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "investment plans insert own"
  on public.investment_plans
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "investment plans update own"
  on public.investment_plans
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  invested_amount numeric(14,2) not null default 0 check (invested_amount >= 0),
  target_date date not null,
  priority text not null check (priority in ('Essential', 'Important', 'Aspirational')),
  expected_return numeric(5,2) not null default 12,
  monthly_need numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists financial_goals_user_id_idx
  on public.financial_goals (user_id, created_at desc);

alter table public.financial_goals enable row level security;

create policy "financial goals select own"
  on public.financial_goals
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "financial goals insert own"
  on public.financial_goals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "financial goals update own"
  on public.financial_goals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  severity text not null check (severity in ('Info', 'Watch', 'Action')),
  is_read boolean not null default false,
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists user_alerts_user_id_idx
  on public.user_alerts (user_id, is_read, created_at desc);

alter table public.user_alerts enable row level security;

create policy "user alerts select own"
  on public.user_alerts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user alerts insert own"
  on public.user_alerts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user alerts update own"
  on public.user_alerts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
