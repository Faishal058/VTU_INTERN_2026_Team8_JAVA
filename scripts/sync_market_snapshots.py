"""
Script to fetch latest market index snapshots from Yahoo Finance and sync them to Supabase.
Currently tracks major indices like NIFTY 50 and SENSEX.
"""

import json
import urllib.request
from datetime import datetime
from pathlib import Path

from supabase_rest import postgrest_insert

# Configuration and Paths
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data"
OUT.mkdir(exist_ok=True)

# Indices to track
SYMBOLS = {
    "NIFTY 50": "%5ENSEI",
    "SENSEX": "%5EBSESN",
}


def fetch_json(url: str) -> dict:
    """Fetches JSON data from a given URL using a standard User-Agent to avoid blocking."""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    """Captures market snapshots and pushes them to the database."""
    print("Capturing market indices...")
    snapshots = []
    
    for name, symbol in SYMBOLS.items():
        # Fetching 5d range to calculate 1d change percentage accurately
        payload = fetch_json(f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=5d")
        
        # Navigate through Yahoo's nested response structure
        result = payload.get("chart", {}).get("result", [{}])[0]
        closes = result.get("indicators", {}).get("quote", [{}])[0].get("close", [])
        
        # Filter out null values from closes
        valid = [value for value in closes if isinstance(value, (int, float))]
        last = valid[-1] if valid else None
        prev = valid[-2] if len(valid) > 1 else last
        
        # Calculate daily change percentage
        change_pct = ((last - prev) / prev * 100) if last and prev else 0
        
        snapshots.append({
            "symbol": symbol,
            "name": name,
            "value": last,
            "change_pct": change_pct,
            "captured_at": datetime.utcnow().isoformat(),
        })

    # Save local log
    path = OUT / f"market-snapshots-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.json"
    print(f"Saving snapshot to {path}")
    path.write_text(json.dumps(snapshots, indent=2), encoding="utf-8")
    
    # Batch insert into Supabase
    postgrest_insert("market_snapshots", snapshots)
    print(f"Success: Wrote market snapshots and synced market_snapshots")


if __name__ == "__main__":
    main()

