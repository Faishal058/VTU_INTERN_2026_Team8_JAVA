import { NextRequest, NextResponse } from "next/server";
import type { NavPoint } from "@/lib/planning";

export async function GET(request: NextRequest) {
  const schemeCode = request.nextUrl.searchParams.get("schemeCode");
  if (!schemeCode) {
    return NextResponse.json({ error: "schemeCode is required." }, { status: 400 });
  }

  const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to fetch NAV history." }, { status: 502 });
  }

  const payload = await response.json();
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const points: NavPoint[] = data.slice(0, 365).reverse().map((item: { date: string; nav: string }) => ({
    date: item.date,
    nav: Number(item.nav),
  })).filter((item) => Number.isFinite(item.nav));

  return NextResponse.json({
    meta: payload?.meta ?? null,
    points,
    latestNav: points.length > 0 ? points[points.length - 1].nav : null,
  });
}
