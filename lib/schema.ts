import { z } from "zod";

export const questionnaireSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  annualIncome: z.coerce.number().min(1000, "Annual income must be at least 1000"),
  monthlyDebt: z.coerce.number().min(0, "Monthly debt cannot be negative"),
  creditScoreRange: z.enum(["below_580", "580_669", "670_739", "740_plus"]),
  employmentStatus: z.enum(["full_time", "part_time", "self_employed", "unemployed"]),
  loanPurpose: z.enum(["debt_consolidation", "medical", "home_improvement", "auto", "personal"]),
  desiredAmount: z.coerce.number().min(500, "Desired amount must be at least 500"),
  state: z.string().length(2, "Use 2-letter state code").transform((s) => s.toUpperCase()),
  notes: z.string().optional()
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;