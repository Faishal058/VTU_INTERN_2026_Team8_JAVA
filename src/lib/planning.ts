export type InvestmentPlan = {
  id: string;
  user_id: string;
  fund_name: string;
  amc: string;
  category: string;
  scheme_code: string | null;
  investment_mode: "SIP" | "Lumpsum";
  amount: number;
  frequency: string;
  start_date: string | null;
  note: string | null;
  risk_profile: "Low" | "Moderate" | "High";
  goal_id: string | null;
  is_paused: boolean;
  is_deleted: boolean;
  created_at: string;
};

export type FinancialGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  invested_amount: number;
  target_date: string;
  priority: "Essential" | "Important" | "Aspirational";
  category: string;
  inflation_rate: number;
  status: "Active" | "Achieved" | "Archived";
  expected_return: number;
  monthly_need: number;
  created_at: string;
};

export type UserAlert = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  severity: "Info" | "Watch" | "Action";
  is_read: boolean;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
};

export type InvestmentTransaction = {
  id: string;
  user_id: string;
  investment_plan_id: string | null;
  transaction_type: "BUY" | "SELL" | "SWITCH";
  amount: number;
  nav: number | null;
  units: number | null;
  transaction_date: string;
  status: string;
  notes: string | null;
  created_at: string;
};

export type UserProfile = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "USER" | "ADMIN";
  updated_at: string;
};

export type NotificationPreferences = {
  user_id: string;
  sip_due_in_app: boolean;
  sip_due_email: boolean;
  goal_milestones_in_app: boolean;
  goal_milestones_email: boolean;
  daily_digest_email: boolean;
  market_alerts_in_app: boolean;
  updated_at: string;
};

export type MutualFundSearchResult = {
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  category: string;
};

export type NavPoint = {
  date: string;
  nav: number;
};

export type CapitalGainLot = {
  buyDate: string;
  sellDate: string;
  units: number;
  buyNav: number;
  sellNav: number;
  amountInvested: number;
  amountRedeemed: number;
  gain: number;
  holdingDays: number;
  taxCategory: "STCG" | "LTCG" | "SLAB";
};

export function calculateMonthlyNeed(
  targetAmount: number,
  investedAmount: number,
  targetDate: string,
  expectedReturn: number,
): number {
  const remaining = Math.max(targetAmount - investedAmount, 0);
  if (remaining === 0) return 0;

  const today = new Date();
  const end = new Date(targetDate);
  const months = Math.max(
    (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth()),
    1,
  );

  const monthlyRate = expectedReturn / 100 / 12;
  if (monthlyRate <= 0) return remaining / months;

  const growthFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  if (growthFactor <= 0) return remaining / months;

  return remaining / growthFactor;
}

export function getGoalProgress(goal: FinancialGoal): number {
  if (goal.target_amount <= 0) return 0;
  return (goal.invested_amount / goal.target_amount) * 100;
}

export function calculateUnits(amount: number, nav: number | null): number | null {
  if (!nav || nav <= 0) return null;
  return amount / nav;
}

export function calculateAbsoluteReturn(currentValue: number, invested: number): number {
  if (invested <= 0) return 0;
  return ((currentValue - invested) / invested) * 100;
}

export function calculateCagr(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || finalValue <= 0 || years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

export function calculateFutureValueOfSip(amount: number, annualRate: number, months: number): number {
  if (amount <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return amount * months;
  return amount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
}

export function buildCapitalGainLots(transactions: InvestmentTransaction[]): CapitalGainLot[] {
  const buys = transactions
    .filter((item) => item.transaction_type === "BUY" && (item.units ?? 0) > 0 && (item.nav ?? 0) > 0)
    .sort((left, right) => new Date(left.transaction_date).getTime() - new Date(right.transaction_date).getTime())
    .map((item) => ({ ...item, remainingUnits: item.units ?? 0 }));

  const sells = transactions
    .filter((item) => item.transaction_type === "SELL" && (item.units ?? 0) > 0 && (item.nav ?? 0) > 0)
    .sort((left, right) => new Date(left.transaction_date).getTime() - new Date(right.transaction_date).getTime());

  const lots: CapitalGainLot[] = [];

  for (const sell of sells) {
    let unitsToAllocate = sell.units ?? 0;
    while (unitsToAllocate > 0) {
      const buy = buys.find((item) => item.remainingUnits > 0);
      if (!buy || !buy.nav || !sell.nav) break;

      const allocatedUnits = Math.min(unitsToAllocate, buy.remainingUnits);
      buy.remainingUnits -= allocatedUnits;
      unitsToAllocate -= allocatedUnits;

      const buyDate = new Date(buy.transaction_date);
      const sellDate = new Date(sell.transaction_date);
      const holdingDays = Math.max(Math.round((sellDate.getTime() - buyDate.getTime()) / 86400000), 0);
      const gain = allocatedUnits * (sell.nav - buy.nav);

      lots.push({
        buyDate: buy.transaction_date,
        sellDate: sell.transaction_date,
        units: allocatedUnits,
        buyNav: buy.nav,
        sellNav: sell.nav,
        amountInvested: allocatedUnits * buy.nav,
        amountRedeemed: allocatedUnits * sell.nav,
        gain,
        holdingDays,
        taxCategory: holdingDays >= 365 ? "LTCG" : "STCG",
      });
    }
  }

  return lots;
}

export function summarizeCapitalGains(lots: CapitalGainLot[]) {
  const stcg = lots.filter((item) => item.taxCategory === "STCG").reduce((sum, item) => sum + item.gain, 0);
  const ltcg = lots.filter((item) => item.taxCategory === "LTCG").reduce((sum, item) => sum + item.gain, 0);
  const ltcgTaxable = Math.max(ltcg - 125000, 0);

  return {
    stcg,
    ltcg,
    stcgTax: Math.max(stcg, 0) * 0.2,
    ltcgTax: ltcgTaxable * 0.125,
    totalTax: Math.max(stcg, 0) * 0.2 + ltcgTaxable * 0.125,
  };
}
