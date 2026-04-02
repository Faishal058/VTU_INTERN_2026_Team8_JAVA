import { NextRequest, NextResponse } from "next/server";
import type { MutualFundSearchResult } from "@/lib/planning";

function inferCategory(name: string): string {
  if (/small cap/i.test(name)) return "Small Cap";
  if (/mid cap/i.test(name)) return "Mid Cap";
  if (/large cap|bluechip/i.test(name)) return "Large Cap";
  if (/flexi|multi cap/i.test(name)) return "Flexi Cap";
  if (/index/i.test(name)) return "Index";
  if (/debt|bond|income/i.test(name)) return "Debt";
  if (/hybrid|balanced/i.test(name)) return "Hybrid";
  if (/liquid/i.test(name)) return "Liquid";
  return "Other";
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const response = await fetch("https://www.amfiindia.com/spages/NAVAll.txt", {
    next: { revalidate: 60 * 60 * 12 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to fetch fund master list." }, { status: 502 });
  }

  const text = await response.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const results: MutualFundSearchResult[] = [];
  let currentHouse = "Unknown AMC";

  for (const line of lines) {
    if (!line.includes(";")) {
      currentHouse = line.trim();
      continue;
    }

    const parts = line.split(";");
    if (parts.length < 4) continue;

    const schemeCode = parts[0]?.trim();
    const schemeName = parts[3]?.trim();
    if (!schemeCode || !schemeName) continue;

    if (!schemeName.toLowerCase().includes(query) && !currentHouse.toLowerCase().includes(query)) {
      continue;
    }

    results.push({
      schemeCode,
      schemeName,
      fundHouse: currentHouse,
      category: inferCategory(schemeName),
    });

    if (results.length >= 12) break;
  }

  return NextResponse.json({ results });
}
