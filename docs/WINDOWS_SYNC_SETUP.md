# Windows Sync Setup

This project includes two Python sync scripts:

- `scripts/sync_fund_master.py`
- `scripts/sync_market_snapshots.py`

They use only Python standard library modules and now do both of these on each run:

- write timestamped local snapshot files into `data/`
- write fresh records directly into Supabase cache tables

## What You Need First

1. Apply these migrations in Supabase:
   - `supabase/migrations/20260323_add_planning_tables.sql`
   - `supabase/migrations/20260325_expand_product_modules.sql`
   - `supabase/migrations/20260325_add_scheme_code.sql`
   - `supabase/migrations/20260325_add_market_cache.sql`
2. Make sure `.env.local` exists in the project root.
3. Add these environment variables to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` is strongly recommended for the Python sync scripts because they write directly to Supabase. The scripts can fall back to the anon key, but that is less reliable for scheduled write jobs.

## What Gets Synced

### Fund master sync

`scripts/sync_fund_master.py`:
- downloads the AMFI fund master/NAV feed
- writes JSON and CSV snapshots into `data/`
- upserts rows into `public.fund_master_cache` using `scheme_code`

### Market snapshot sync

`scripts/sync_market_snapshots.py`:
- fetches benchmark market data
- writes a JSON snapshot into `data/`
- inserts rows into `public.market_snapshots`

## Manual Run

Open PowerShell in:

`D:\Genesis\VTU_INTERN_2026_Team8_JAVA\wealthwise`

Run:

```powershell
py -3 .\scripts\sync_fund_master.py
py -3 .\scripts\sync_market_snapshots.py
```

If `py` is unavailable, use:

```powershell
python .\scripts\sync_fund_master.py
python .\scripts\sync_market_snapshots.py
```

Expected result:
- new timestamped files appear under `data/`
- Supabase receives rows in `fund_master_cache`
- Supabase receives rows in `market_snapshots`

## Batch File Helpers

You can also run:

```powershell
.\scripts\run_fund_master_sync.bat
.\scripts\run_market_sync.bat
```

These batch files change into the project root before running the Python scripts, so `.env.local` is picked up correctly.

## Task Scheduler Setup

### Fund Master Sync

1. Open `Task Scheduler`.
2. Click `Create Basic Task...`
3. Name: `WealthWise Fund Master Sync`
4. Trigger: `Daily`
5. Choose a time like `11:30 PM`
6. Action: `Start a program`
7. Program/script:

`D:\Genesis\VTU_INTERN_2026_Team8_JAVA\wealthwise\scripts\run_fund_master_sync.bat`

8. Finish and save.

### Market Snapshot Sync

1. Click `Create Basic Task...`
2. Name: `WealthWise Market Snapshot Sync`
3. Trigger: `Daily`
4. Choose a time like `6:15 PM`
5. Action: `Start a program`
6. Program/script:

`D:\Genesis\VTU_INTERN_2026_Team8_JAVA\wealthwise\scripts\run_market_sync.bat`

7. Finish and save.

## PowerShell Scheduled Task Commands

Run PowerShell as your normal user:

```powershell
$fundAction = New-ScheduledTaskAction -Execute "D:\Genesis\VTU_INTERN_2026_Team8_JAVA\wealthwise\scripts\run_fund_master_sync.bat"
$fundTrigger = New-ScheduledTaskTrigger -Daily -At 11:30PM
Register-ScheduledTask -TaskName "WealthWise Fund Master Sync" -Action $fundAction -Trigger $fundTrigger -Description "Sync AMFI fund master into local snapshots and Supabase"
```

```powershell
$marketAction = New-ScheduledTaskAction -Execute "D:\Genesis\VTU_INTERN_2026_Team8_JAVA\wealthwise\scripts\run_market_sync.bat"
$marketTrigger = New-ScheduledTaskTrigger -Daily -At 6:15PM
Register-ScheduledTask -TaskName "WealthWise Market Snapshot Sync" -Action $marketAction -Trigger $marketTrigger -Description "Sync benchmark market snapshots into local files and Supabase"
```

## Verify The Sync

### Check local output

```powershell
Get-ChildItem .\data
```

### Check Supabase tables

In Supabase SQL Editor, run:

```sql
select count(*) from public.fund_master_cache;
select count(*) from public.market_snapshots;
```

You can also inspect the latest rows:

```sql
select * from public.fund_master_cache order by updated_at desc limit 10;
select * from public.market_snapshots order by captured_at desc limit 10;
```

## Troubleshooting

- If the script says Supabase URL/key is missing, verify `.env.local` exists and contains the keys above.
- If local files are created but Supabase is not updated, verify `SUPABASE_SERVICE_ROLE_KEY` and confirm the migration `20260325_add_market_cache.sql` has been applied.
- If Task Scheduler runs but nothing updates, run the `.bat` files manually first to confirm Python is available on that machine.
- If `py -3` is unavailable, install Python from python.org and re-run the batch files.
