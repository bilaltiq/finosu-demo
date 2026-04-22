export type LoanProduct = {
  id: string;
  name: string;
  provider: string;
  minCreditScore: number;
  maxDebtToIncome: number;
  minAmount: number;
  maxAmount: number;
  statesAllowed: string[];
  employmentAllowed: Array<"full_time" | "part_time" | "self_employed" | "unemployed">;
  aprRange: string;
  aprMin: number;
  aprMax: number;
  termMonths: number;
  description: string;
};

export const loans: LoanProduct[] = [
  {
    id: "l1",
    name: "Flex Personal Loan",
    provider: "Northstar Lending",
    minCreditScore: 580,
    maxDebtToIncome: 0.45,
    minAmount: 1000,
    maxAmount: 15000,
    statesAllowed: ["CA", "TX", "NY", "FL", "WA", "IL"],
    employmentAllowed: ["full_time", "part_time", "self_employed"],
    aprRange: "9.9% - 18.5%",
    aprMin: 9.9,
    aprMax: 18.5,
    termMonths: 36,
    description: "General-purpose personal loan with mid-range APR."
  },
  {
    id: "l2",
    name: "Prime Debt Consolidation",
    provider: "BluePeak Finance",
    minCreditScore: 670,
    maxDebtToIncome: 0.42,
    minAmount: 5000,
    maxAmount: 25000,
    statesAllowed: ["CA", "TX", "FL", "WA", "AZ", "NV"],
    employmentAllowed: ["full_time", "self_employed"],
    aprRange: "7.2% - 12.9%",
    aprMin: 7.2,
    aprMax: 12.9,
    termMonths: 48,
    description: "Designed for debt consolidation with stronger borrower profiles."
  },
  {
    id: "l3",
    name: "Access Medical Support",
    provider: "Harbor Credit",
    minCreditScore: 560,
    maxDebtToIncome: 0.5,
    minAmount: 1500,
    maxAmount: 12000,
    statesAllowed: ["CA", "TX", "NY", "NJ", "FL", "IL"],
    employmentAllowed: ["full_time", "part_time", "self_employed", "unemployed"],
    aprRange: "11.5% - 21.9%",
    aprMin: 11.5,
    aprMax: 21.9,
    termMonths: 24,
    description: "Medical and emergency-focused financing."
  },
  {
    id: "l4",
    name: "Home Upgrade Loan",
    provider: "Oakline Capital",
    minCreditScore: 640,
    maxDebtToIncome: 0.43,
    minAmount: 3000,
    maxAmount: 30000,
    statesAllowed: ["CA", "TX", "FL", "WA", "CO", "OR"],
    employmentAllowed: ["full_time", "self_employed"],
    aprRange: "8.5% - 15.4%",
    aprMin: 8.5,
    aprMax: 15.4,
    termMonths: 60,
    description: "Longer-term financing for home improvement projects."
  },
  {
    id: "l5",
    name: "Starter Personal Credit",
    provider: "Summit Borrow",
    minCreditScore: 520,
    maxDebtToIncome: 0.52,
    minAmount: 500,
    maxAmount: 8000,
    statesAllowed: ["CA", "TX", "FL", "NV", "AZ", "IL", "GA"],
    employmentAllowed: ["full_time", "part_time", "self_employed"],
    aprRange: "15.9% - 27.0%",
    aprMin: 15.9,
    aprMax: 27.0,
    termMonths: 18,
    description: "Smaller loan amounts for thinner credit files."
  },
  {
    id: "l6",
    name: "Auto Repair Relief",
    provider: "BridgePath Loans",
    minCreditScore: 600,
    maxDebtToIncome: 0.47,
    minAmount: 1000,
    maxAmount: 10000,
    statesAllowed: ["CA", "TX", "NY", "FL", "IL", "PA"],
    employmentAllowed: ["full_time", "part_time", "self_employed"],
    aprRange: "10.4% - 17.8%",
    aprMin: 10.4,
    aprMax: 17.8,
    termMonths: 24,
    description: "Auto and urgent repair financing."
  },
  {
    id: "l7",
    name: "Preferred Personal Loan",
    provider: "Cedar Trust",
    minCreditScore: 740,
    maxDebtToIncome: 0.38,
    minAmount: 5000,
    maxAmount: 40000,
    statesAllowed: ["CA", "TX", "FL", "WA", "MA", "VA"],
    employmentAllowed: ["full_time", "self_employed"],
    aprRange: "6.4% - 10.2%",
    aprMin: 6.4,
    aprMax: 10.2,
    termMonths: 60,
    description: "Best rates for strong borrowers."
  },
  {
    id: "l8",
    name: "Everyday Personal Loan",
    provider: "Riverbank Credit",
    minCreditScore: 620,
    maxDebtToIncome: 0.46,
    minAmount: 2000,
    maxAmount: 18000,
    statesAllowed: ["CA", "TX", "NY", "FL", "OH", "MI"],
    employmentAllowed: ["full_time", "part_time", "self_employed"],
    aprRange: "9.1% - 16.7%",
    aprMin: 9.1,
    aprMax: 16.7,
    termMonths: 36,
    description: "Balanced product for general personal borrowing."
  }
];