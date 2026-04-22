import { NextResponse } from "next/server";
import OpenAI from "openai";
import { questionnaireSchema } from "@/lib/schema";
import { loans } from "@/lib/loans";
import { filterEligibleLoans, rankLoans, estimateDTI } from "@/lib/rules";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function getLoanTradeoff(aprRange: string, termMonths: number, description: string) {
  if (termMonths >= 60) {
    return "The longer repayment term can mean paying more total interest over time.";
  }

  if (aprRange.includes("18.9") || aprRange.includes("19.9") || aprRange.includes("22.")) {
    return "The APR is on the higher side, so monthly affordability may come with a higher borrowing cost.";
  }

  if (description.toLowerCase().includes("smaller loan")) {
    return "This option may be less suitable if you expect to need a larger borrowing amount later.";
  }

  return "This option may be less flexible if your priorities change and you want different rate or term tradeoffs.";
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = questionnaireSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const profile = parsed.data;
    const { eligible, rejected } = filterEligibleLoans(profile, loans);
    const dti = estimateDTI(profile.annualIncome, profile.monthlyDebt);

    if (eligible.length === 0) {
      return NextResponse.json({
        summary:
          "No products matched the current eligibility rules. In a production system, this is where we would either request more information or surface alternative next steps.",
        eligibleLoans: [],
        rejectedCount: rejected.length
      });
    }

    const ranked = rankLoans(profile, eligible).slice(0, 3);

    const fallbackRecommendations = ranked.map(({ loan }) => ({
      id: loan.id,
      name: loan.name,
      provider: loan.provider,
      reason: `Recommended because it fits the requested amount, meets eligibility rules, and offers an APR range of ${loan.aprRange}.`,
      tradeoff: getLoanTradeoff(loan.aprRange, loan.termMonths, loan.description),
      aprRange: loan.aprRange,
      termMonths: loan.termMonths
    }));

    const prompt = `
You are assisting a fintech loan recommendation demo.

Rules:
- Only consider the eligible products provided below.
- Do not invent any products, lenders, APR values, or terms.
- Return exactly 3 recommendations or fewer if fewer are provided.
- Keep explanations concise and professional.
- Include exactly one tradeoff for each recommendation.
- Output valid JSON only.

User profile:
${JSON.stringify(
  {
    fullName: profile.fullName,
    annualIncome: profile.annualIncome,
    monthlyDebt: profile.monthlyDebt,
    estimatedDTI: Number((dti * 100).toFixed(1)) + "%",
    creditScoreRange: profile.creditScoreRange,
    employmentStatus: profile.employmentStatus,
    loanPurpose: profile.loanPurpose,
    desiredAmount: profile.desiredAmount,
    state: profile.state,
    notes: profile.notes ?? ""
  },
  null,
  2
)}

Eligible loan products:
${JSON.stringify(
  ranked.map(({ loan }) => ({
    id: loan.id,
    name: loan.name,
    provider: loan.provider,
    aprRange: loan.aprRange,
    termMonths: loan.termMonths,
    description: loan.description,
    minAmount: loan.minAmount,
    maxAmount: loan.maxAmount
  })),
  null,
  2
)}

Return JSON in this shape:
{
  "summary": "string",
  "recommendations": [
    {
      "id": "string",
      "reason": "string",
      "tradeoff": "string"
    }
  ]
}
`;

    try {
      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: prompt
      });

      const text = response.output_text;
      const parsedLLM = JSON.parse(text);

      const recommendations = (parsedLLM.recommendations || []).map(
        (rec: { id: string; reason: string; tradeoff?: string }) => {
          const match = ranked.find((r) => r.loan.id === rec.id);
          if (!match) return null;

          return {
            id: match.loan.id,
            name: match.loan.name,
            provider: match.loan.provider,
            reason: rec.reason,
            tradeoff:
              rec.tradeoff?.trim() ||
              getLoanTradeoff(
                match.loan.aprRange,
                match.loan.termMonths,
                match.loan.description
              ),
            aprRange: match.loan.aprRange,
            termMonths: match.loan.termMonths
          };
        }
      ).filter(Boolean);

      return NextResponse.json({
        summary: parsedLLM.summary || "Eligible loan recommendations generated successfully.",
        eligibleLoans: recommendations.length > 0 ? recommendations : fallbackRecommendations,
        rejectedCount: rejected.length
      });
    } catch {
      return NextResponse.json({
        summary:
          "Recommendations were generated using the deterministic ranking engine. The architecture supports an optional LLM explanation layer after eligibility filtering.",
        eligibleLoans: fallbackRecommendations,
        rejectedCount: rejected.length
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while generating recommendations." },
      { status: 500 }
    );
  }
}
