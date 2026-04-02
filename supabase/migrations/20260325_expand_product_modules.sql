alter table public.investment_plans
  add column if not exists goal_id uuid references public.financial_goals(id) on delete set null,
  add column if not exists is_paused boolean not null default false,
  add column if not exists is_deleted boolean not null default false;

alter table public.financial_goals
  add column if not exists category text not null default 'Custom',
  add column if not exists inflation_rate numeric(5,2) not null default 6,
  add column if not exists status text not null default 'Active'
    check (status in ('Active', 'Achieved', 'Archived'));

create table if not exists public.investment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_plan_id uuid references public.investment_plans(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('BUY', 'SELL', 'SWITCH')),
  amount numeric(14,2) not null check (amount > 0),
  nav numeric(12,4),
  units numeric(14,4),
  transaction_date date not null,
  status text not null default 'Completed',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists investment_transactions_user_id_idx
  on public.investment_transactions (user_id, transaction_date desc);

alter table public.investment_transactions enable row level security;

create policy "investment transactions select own"
  on public.investment_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "investment transactions insert own"
  on public.investment_transactions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "investment transactions update own"
  on public.investment_transactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "user profiles select own"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user profiles upsert own"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user profiles update own"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sip_due_in_app boolean not null default true,
  sip_due_email boolean not null default false,
  goal_milestones_in_app boolean not null default true,
  goal_milestones_email boolean not null default false,
  daily_digest_email boolean not null default false,
  market_alerts_in_app boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification preferences select own"
  on public.notification_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notification preferences upsert own"
  on public.notification_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "notification preferences update own"
  on public.notification_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
