"""
Main script for syncing the master list of mutual funds from AMFI (Association of Mutual Funds in India).
It fetches the latest NAV data, processes it into a structured format, and syncs it with Supabase.
"""

import csv
import json
from datetime import datetime
from pathlib import Path

from supabase_rest import postgrest_upsert
import urllib.request

# Configuration and Paths
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data"
OUT.mkdir(exist_ok=True)

# Sources for mutual fund data
AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt"


def infer_category(name: str) -> str:
    """
    Heuristic-based category inference based on the scheme name.
    Useful for filtering and visualization without a primary category source.
    """
    lowered = name.lower()
    if "small cap" in lowered:
        return "Small Cap"
    if "mid cap" in lowered:
        return "Mid Cap"
    if "large cap" in lowered or "bluechip" in lowered:
        return "Large Cap"
    if "flexi" in lowered or "multi cap" in lowered:
        return "Flexi Cap"
    if "index" in lowered:
        return "Index"
    if "debt" in lowered or "bond" in lowered:
        return "Debt"
    if "hybrid" in lowered or "balanced" in lowered:
        return "Hybrid"
    return "Other"


def fetch_text(url: str) -> str:
    """Fetches text content from a given URL using standard library for zero dependencies."""
    with urllib.request.urlopen(url) as response:
        return response.read().decode("utf-8", errors="ignore")


def build_fund_master() -> list[dict]:
    """
    Parses the raw AMFI text format into an array of structured dictionaries.
    AMFI format uses ';' as a separator and interleaves AMC (Asset Management Company) headers.
    """
    text = fetch_text(AMFI_URL)
    rows = []
    current_house = "Unknown AMC"
    
    for line in text.splitlines():
        if not line.strip():
            continue
        
        # AMC Header line (doesn't contain separators)
        if ";" not in line:
            current_house = line.strip()
            continue
        
        parts = line.split(";")
        if len(parts) < 6:
            continue
            
        scheme_code = parts[0].strip()
        scheme_name = parts[3].strip()
        nav = parts[4].strip()
        nav_date = parts[5].strip()
        
        if not scheme_code or not scheme_name:
            continue
            
        # Parse NAV value as float
        try:
            nav_val = float(nav) if nav else None
        except ValueError:
            continue

        # Parse date from dd-MMM-yyyy to ISO format
        try:
            iso_date = datetime.strptime(nav_date, "%d-%b-%Y").date().isoformat() if nav_date else None
        except ValueError:
            continue

        rows.append({
            "scheme_code": scheme_code,
            "scheme_name": scheme_name,
            "fund_house": current_house,
            "category": infer_category(scheme_name),
            "nav": nav_val,
            "nav_date": iso_date,
            "updated_at": datetime.utcnow().isoformat(),
        })
    return rows


def main() -> None:
    """Orchestrates the build and sync process."""
    print("Fetching fund master from AMFI...")
    funds = build_fund_master()
    
    # Save a local snapshot for audit/debug purposes
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    json_path = OUT / f"fund-master-{timestamp}.json"
    csv_path = OUT / f"fund-master-{timestamp}.csv"
    
    print(f"Saving snapshots to {json_path}")
    json_path.write_text(json.dumps(funds, indent=2), encoding="utf-8")
    
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["scheme_code", "scheme_name", "fund_house", "category", "nav", "nav_date", "updated_at"])
        writer.writeheader()
        writer.writerows(funds)

    # Sync to Supabase via PostgREST
    print("Syncing with Supabase...")
    postgrest_upsert("fund_master_cache", funds, on_conflict="scheme_code")
    print(f"Success: Wrote {len(funds)} funds to local files and synced fund_master_cache")


if __name__ == "__main__":
    main()
