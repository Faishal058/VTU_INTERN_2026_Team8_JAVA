import { NextResponse } from "next/server";

const symbols = [
  { key: "NIFTY 50", symbol: "%5ENSEI" },
  { key: "SENSEX", symbol: "%5EBSESN" },
];

export async function GET() {
  const results = await Promise.all(
    symbols.map(async ({ key, symbol }) => {
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`, {
          next: { revalidate: 60 * 15 },
        });
        if (!response.ok) throw new Error("Market fetch failed");
        const payload = await response.json();
        const closes = payload?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
        const valid = closes.filter((value: number | null) => typeof value === "number");
        const last = valid.at(-1) ?? null;
        const prev = valid.at(-2) ?? last;
        const changePct = last && prev ? ((last - prev) / prev) * 100 : 0;
        return { name: key, value: last, changePct };
      } catch {
        return { name: key, value: null, changePct: 0 };
      }
    }),
  );

  return NextResponse.json({ indices: results });
}
