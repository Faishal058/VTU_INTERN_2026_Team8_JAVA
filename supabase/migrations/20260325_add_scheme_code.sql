alter table public.investment_plans
  add column if not exists scheme_code text;
