import type { QuestionnaireInput } from "./schema";
import type { LoanProduct } from "./loans";

export type RejectionReason = {
  loanId: string;
  reasons: string[];
};

export function estimateMonthlyIncome(annualIncome: number) {
  return annualIncome / 12;
}

export function estimateDTI(annualIncome: number, monthlyDebt: number) {
  const monthlyIncome = estimateMonthlyIncome(annualIncome);
  if (monthlyIncome <= 0) return 1;
  return monthlyDebt / monthlyIncome;
}

export function creditScoreProxy(range: QuestionnaireInput["creditScoreRange"]) {
  switch (range) {
    case "below_580":
      return 550;
    case "580_669":
      return 625;
    case "670_739":
      return 705;
    case "740_plus":
      return 760;
  }
}

export function amountFitScore(desiredAmount: number, minAmount: number, maxAmount: number) {
  const midpoint = (minAmount + maxAmount) / 2;
  const distance = Math.abs(desiredAmount - midpoint);
  return Math.max(0, 1 - distance / Math.max(maxAmount, 1));
}

export function creditCompatibilityScore(userCredit: number, loanMinCredit: number) {
  const diff = userCredit - loanMinCredit;
  if (diff < 0) return 0;
  return Math.min(1, 0.5 + diff / 300);
}

export function filterEligibleLoans(profile: QuestionnaireInput, loans: LoanProduct[]) {
  const dti = estimateDTI(profile.annualIncome, profile.monthlyDebt);
  const credit = creditScoreProxy(profile.creditScoreRange);

  const eligible: LoanProduct[] = [];
  const rejected: RejectionReason[] = [];

  for (const loan of loans) {
    const reasons: string[] = [];

    if (credit < loan.minCreditScore) {
      reasons.push(`Credit score below minimum of ${loan.minCreditScore}`);
    }

    if (dti > loan.maxDebtToIncome) {
      reasons.push(`Debt-to-income ratio exceeds max of ${(loan.maxDebtToIncome * 100).toFixed(0)}%`);
    }

    if (profile.desiredAmount < loan.minAmount || profile.desiredAmount > loan.maxAmount) {
      reasons.push(`Requested amount outside supported range of ${loan.minAmount}-${loan.maxAmount}`);
    }

    if (!loan.statesAllowed.includes(profile.state)) {
      reasons.push(`Loan not available in ${profile.state}`);
    }

    if (!loan.employmentAllowed.includes(profile.employmentStatus)) {
      reasons.push(`Employment type not supported`);
    }

    if (reasons.length === 0) {
      eligible.push(loan);
    } else {
      rejected.push({ loanId: loan.id, reasons });
    }
  }

  return { eligible, rejected, dti, credit };
}

export function rankLoans(profile: QuestionnaireInput, eligibleLoans: LoanProduct[]) {
  const credit = creditScoreProxy(profile.creditScoreRange);

  return [...eligibleLoans]
    .map((loan) => {
      const aprScore = 1 - loan.aprMin / 30;
      const fitScore = amountFitScore(profile.desiredAmount, loan.minAmount, loan.maxAmount);
      const creditScore = creditCompatibilityScore(credit, loan.minCreditScore);

      const totalScore = aprScore * 0.45 + fitScore * 0.3 + creditScore * 0.25;

      return {
        loan,
        totalScore
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}