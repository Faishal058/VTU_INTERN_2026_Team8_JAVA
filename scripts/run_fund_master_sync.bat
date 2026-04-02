@echo off
setlocal
cd /d "%~dp0.."
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
  "%LocalAppData%\Programs\Python\Python312\python.exe" scripts\sync_fund_master.py
) else (
  py -3 scripts\sync_fund_master.py
)
endlocal
