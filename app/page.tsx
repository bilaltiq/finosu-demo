"use client";

import { useMemo, useState } from "react";

type Recommendation = {
  id: string;
  name: string;
  provider: string;
  reason: string;
  tradeoff: string;
  aprRange: string;
  termMonths: number;
};

type SelectedLoanHistoryItem = Recommendation & {
  selectedAt: string;
};

type ApiResult = {
  summary: string;
  eligibleLoans: Recommendation[];
  rejectedCount: number;
  error?: string;
};

type FormState = {
  fullName: string;
  annualIncome: string;
  monthlyDebt: string;
  creditScoreRange: "below_580" | "580_669" | "670_739" | "740_plus";
  employmentStatus: "full_time" | "part_time" | "self_employed" | "unemployed";
  loanPurpose:
    | "debt_consolidation"
    | "medical"
    | "home_improvement"
    | "auto"
    | "personal";
  desiredAmount: string;
  state: string;
  notes: string;
};

const initialForm: FormState = {
  fullName: "",
  annualIncome: "",
  monthlyDebt: "",
  creditScoreRange: "670_739",
  employmentStatus: "full_time",
  loanPurpose: "personal",
  desiredAmount: "",
  state: "CA",
  notes: "",
};

type Option<T extends string> = {
  label: string;
  value: T;
  description?: string;
};

type MultipleChoiceStep = {
  id: string;
  type: "mcq";
  title: string;
  subtitle?: string;
  field: keyof FormState;
  options: Option<FormState[keyof FormState] & string>[];
};

type InputStep = {
  id: string;
  type: "input";
  title: string;
  subtitle?: string;
  fields: Array<{
    name: keyof FormState;
    label: string;
    placeholder?: string;
    type?: "text" | "number";
    maxLength?: number;
  }>;
};

type Step = MultipleChoiceStep | InputStep;

const steps: Step[] = [
  {
    id: "purpose",
    type: "mcq",
    title: "What are you looking to use the loan for?",
    subtitle: "We’ll tailor recommendations based on your goal.",
    field: "loanPurpose",
    options: [
      {
        label: "Personal",
        value: "personal",
        description: "Flexible general-purpose borrowing",
      },
      {
        label: "Debt Consolidation",
        value: "debt_consolidation",
        description: "Combine balances into one payment",
      },
      {
        label: "Medical",
        value: "medical",
        description: "Unexpected health-related expenses",
      },
      {
        label: "Home Improvement",
        value: "home_improvement",
        description: "Renovation or home upgrades",
      },
      {
        label: "Auto",
        value: "auto",
        description: "Vehicle repair or transportation needs",
      },
    ],
  },
  {
    id: "credit",
    type: "mcq",
    title: "What’s your approximate credit profile?",
    subtitle: "A range is enough for this recommendation flow.",
    field: "creditScoreRange",
    options: [
      { label: "Below 580", value: "below_580" },
      { label: "580–669", value: "580_669" },
      { label: "670–739", value: "670_739" },
      { label: "740+", value: "740_plus" },
    ],
  },
  {
    id: "employment",
    type: "mcq",
    title: "What’s your current employment status?",
    subtitle: "This helps us match available products.",
    field: "employmentStatus",
    options: [
      { label: "Full-time", value: "full_time" },
      { label: "Part-time", value: "part_time" },
      { label: "Self-employed", value: "self_employed" },
      { label: "Unemployed", value: "unemployed" },
    ],
  },
  {
    id: "financials",
    type: "input",
    title: "Tell us a bit about your financial profile",
    subtitle: "These numbers power the recommendation rules.",
    fields: [
      {
        name: "annualIncome",
        label: "Annual income",
        placeholder: "85000",
        type: "number",
      },
      {
        name: "monthlyDebt",
        label: "Monthly debt",
        placeholder: "1200",
        type: "number",
      },
      {
        name: "desiredAmount",
        label: "Desired loan amount",
        placeholder: "10000",
        type: "number",
      },
    ],
  },
  {
    id: "identity",
    type: "input",
    title: "A few final details",
    subtitle: "Used to personalize the final summary.",
    fields: [
      {
        name: "fullName",
        label: "Full name",
        placeholder: "Bilal Khan",
        type: "text",
      },
      {
        name: "state",
        label: "State code",
        placeholder: "CA",
        type: "text",
        maxLength: 2,
      },
      {
        name: "notes",
        label: "Optional context",
        placeholder: "Anything else we should know?",
        type: "text",
      },
    ],
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [selectedLoanHistory, setSelectedLoanHistory] = useState<
    SelectedLoanHistoryItem[]
  >([]);

  const step = steps[currentStep];
  const progress = useMemo(
    () => ((currentStep + 1) / steps.length) * 100,
    [currentStep],
  );

  function updateField(name: keyof FormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: name === "state" ? value.toUpperCase() : value,
    }));
  }

  function goNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function goBack() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  function handleMCQSelect(field: keyof FormState, value: string) {
    if (transitioning) return;

    setForm((prev) => ({
      ...prev,
      [field]: value as FormState[keyof FormState],
    }));
    setTransitioning(true);

    setTimeout(() => {
      goNext();
      setTransitioning(false);
    }, 180);
  }

  function canContinueInputStep(inputStep: InputStep) {
    return inputStep.fields.every((field) => {
      const value = form[field.name];
      if (field.name === "notes") return true;
      return String(value).trim().length > 0;
    });
  }

  function addLoanToHistory(loan: Recommendation) {
    setSelectedLoanHistory((prev) => [
      {
        ...loan,
        selectedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
  }

  async function submitApplication() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          annualIncome: Number(form.annualIncome),
          monthlyDebt: Number(form.monthlyDebt),
          desiredAmount: Number(form.desiredAmount),
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        summary: "",
        eligibleLoans: [],
        rejectedCount: 0,
        error: "Failed to fetch recommendations.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f4] text-[#111111]">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-6 md:px-10">
        <header className="mb-14 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-black/5 bg-[#ececeb] px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white">
              Finosu
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="rounded-full px-4 py-3 text-sm font-medium text-black/70">
                For Borrowers
              </span>
              <span className="rounded-full px-4 py-3 text-sm font-medium text-black/70">
                Log in
              </span>
              <span className="rounded-full bg-[#030b23] px-6 py-3 text-sm font-semibold text-white">
                Get Started
              </span>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex rounded-full border border-[#d8dcff] bg-white px-5 py-2 text-xs font-medium uppercase tracking-[0.24em] text-[#6f7bf7]">
            What we do
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#0d0d16] md:text-7xl">
            Intelligent loan recommendations across the borrower journey
          </h1>
          <p className="mx-auto mt-8 max-w-3xl font-mono text-lg leading-9 text-black/65 md:text-[1.4rem]">
            Bilal Tariq will be the best intern you will ever hire.
          </p>
        </section>

        <section className="mt-20 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-[#ececeb] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.04)]">
              <div className="rounded-[1.7rem] bg-white p-7 md:p-9">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6f7bf7]">
                      Guided intake
                    </p>
                    <p className="mt-2 font-mono text-sm text-black/55">
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  </div>
                  <div className="w-28 overflow-hidden rounded-full bg-black/6">
                    <div
                      className="h-2 rounded-full bg-[#111827] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div
                  className={cn(
                    "transition-all duration-200",
                    transitioning && "translate-y-1 opacity-60",
                  )}
                >
                  <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#111111] md:text-4xl">
                    {step.title}
                  </h2>
                  {step.subtitle && (
                    <p className="mt-4 max-w-2xl font-mono text-base leading-7 text-black/60">
                      {step.subtitle}
                    </p>
                  )}

                  {step.type === "mcq" && (
                    <div className="mt-10 grid gap-4">
                      {step.options.map((option) => {
                        const selected = form[step.field] === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              handleMCQSelect(step.field, option.value)
                            }
                            className={cn(
                              "group w-full rounded-[1.5rem] border px-6 py-5 text-left transition-all duration-200",
                              "hover:-translate-y-0.5",
                              selected
                                ? "border-[#111827] bg-[#111827] text-white shadow-[0_12px_28px_rgba(17,24,39,0.18)]"
                                : "border-black/8 bg-[#fafafa] hover:border-black/15 hover:bg-white",
                            )}
                          >
                            <div className="flex items-start justify-between gap-5">
                              <div>
                                <div className="text-xl font-semibold tracking-[-0.02em]">
                                  {option.label}
                                </div>
                                {option.description && (
                                  <div
                                    className={cn(
                                      "mt-2 max-w-xl font-mono text-sm leading-6",
                                      selected
                                        ? "text-white/75"
                                        : "text-black/55",
                                    )}
                                  >
                                    {option.description}
                                  </div>
                                )}
                              </div>

                              <div
                                className={cn(
                                  "mt-1 h-5 w-5 rounded-full border transition-all",
                                  selected
                                    ? "border-white bg-white"
                                    : "border-black/20 bg-transparent group-hover:border-black/35",
                                )}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {step.type === "input" && (
                    <div className="mt-10 space-y-5">
                      {step.fields.map((field) => (
                        <div key={field.name}>
                          <label className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-black/45">
                            {field.label}
                          </label>
                          <input
                            type={field.type ?? "text"}
                            value={form[field.name]}
                            onChange={(e) =>
                              updateField(field.name, e.target.value)
                            }
                            maxLength={field.maxLength}
                            className="w-full rounded-[1.35rem] border border-black/10 bg-[#fafafa] px-5 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}

                      <div className="flex items-center justify-between pt-4">
                        <button
                          type="button"
                          onClick={goBack}
                          className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black/70 transition hover:border-black/20 hover:bg-black/[0.02]"
                        >
                          Back
                        </button>

                        {currentStep === steps.length - 1 ? (
                          <button
                            type="button"
                            onClick={submitApplication}
                            disabled={loading || !canContinueInputStep(step)}
                            className="rounded-full bg-[#030b23] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(3,11,35,0.18)] transition hover:opacity-95 disabled:opacity-50"
                          >
                            {loading ? "Generating..." : "See recommendations"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={goNext}
                            disabled={!canContinueInputStep(step)}
                            className="rounded-full bg-[#030b23] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(3,11,35,0.18)] transition hover:opacity-95 disabled:opacity-50"
                          >
                            Continue
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[1.9rem] border border-black/5 bg-[#ececeb] p-4">
                <div className="rounded-[1.4rem] bg-white p-5">
                  <div className="mb-6 h-36 rounded-[1rem] border border-black/5 bg-[linear-gradient(to_top,#f8f8f8,#ffffff)] p-4">
                    <div className="flex h-full items-end gap-2">
                      <div className="h-20 w-5 rounded-t-md bg-[#8693ff]" />
                      <div className="h-28 w-5 rounded-t-md bg-[#b0b7ff]" />
                      <div className="h-16 w-5 rounded-t-md bg-[#d3d7ff]" />
                      <div className="h-24 w-5 rounded-t-md bg-[#8693ff]" />
                      <div className="h-12 w-5 rounded-t-md bg-[#d3d7ff]" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                    Rules first
                  </h3>
                  <p className="mt-4 font-mono text-sm leading-7 text-black/60">
                    Deterministic eligibility filtering keeps the recommendation
                    set safe and auditable.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-black/5 bg-[#ececeb] p-4">
                <div className="rounded-[1.4rem] bg-white p-5">
                  <div className="mb-6 h-36 rounded-[1rem] border border-black/5 bg-[linear-gradient(to_top,#f8f8f8,#ffffff)] p-4">
                    <div className="space-y-3">
                      <div className="h-5 w-24 rounded-full bg-[#8693ff]" />
                      <div className="h-3 w-full rounded-full bg-black/8" />
                      <div className="h-3 w-5/6 rounded-full bg-black/8" />
                      <div className="h-3 w-4/6 rounded-full bg-black/8" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                    LLM ranking
                  </h3>
                  <p className="mt-4 font-mono text-sm leading-7 text-black/60">
                    The model only ranks and explains among already valid
                    products.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-black/5 bg-[#ececeb] p-4">
                <div className="rounded-[1.4rem] bg-white p-5">
                  <div className="mb-6 h-36 rounded-[1rem] border border-black/5 bg-[linear-gradient(to_top,#f8f8f8,#ffffff)] p-4">
                    <div className="space-y-3">
                      <div className="h-10 rounded-xl bg-black/5" />
                      <div className="h-10 rounded-xl bg-black/5" />
                      <div className="h-10 rounded-xl bg-black/5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                    Clear outputs
                  </h3>
                  <p className="mt-4 font-mono text-sm leading-7 text-black/60">
                    Borrowers get simple, explainable loan recommendations in
                    one flow.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-black/5 bg-[#ececeb] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.04)]">
            <div className="h-full rounded-[1.7rem] bg-white p-7 md:p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6f7bf7]">
                    Recommendation output
                  </p>
                  <p className="mt-2 font-mono text-sm text-black/55">
                    Filtered by rules, then explained
                  </p>
                </div>
              </div>

              {!result && (
                <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-[#fafafa] p-6">
                  <p className="font-mono text-sm leading-7 text-black/55">
                    Complete the guided flow to generate eligible loan matches
                    and a concise summary for the borrower.
                  </p>
                </div>
              )}

              {result?.error && (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-red-700">
                  {result.error}
                </div>
              )}

              {result && !result.error && (
                <div className="space-y-5">
                  <div className="rounded-[1.5rem] bg-[#111827] p-6 text-white">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/55">
                      Summary
                    </p>
                    <p className="mt-4 font-mono text-sm leading-7 text-white/85">
                      {result.summary}
                    </p>
                  </div>

                  {result.eligibleLoans.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-amber-900">
                      No eligible products found under the current rules.
                    </div>
                  ) : (
                    result.eligibleLoans.map((loan, idx) => (
                      <div
                        key={loan.id}
                        className="rounded-[1.5rem] border border-black/8 bg-[#fafafa] p-5"
                      >
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#6f7bf7]">
                              Recommendation #{idx + 1}
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#111111]">
                              {loan.name}
                            </h3>
                            <p className="mt-1 font-mono text-sm text-black/50">
                              {loan.provider}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                            <p className="text-sm font-semibold text-[#111111]">
                              {loan.aprRange}
                            </p>
                            <p className="mt-1 font-mono text-xs text-black/50">
                              {loan.termMonths} months
                            </p>
                          </div>
                        </div>

                        <p className="font-mono text-sm leading-7 text-black/65">
                          {loan.reason}
                        </p>

                        <div className="mt-4 rounded-2xl border border-[#d8dcff] bg-white px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#6f7bf7]">
                            Tradeoff
                          </p>
                          <p className="mt-2 font-mono text-sm leading-7 text-black/60">
                            {loan.tradeoff}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <p className="font-mono text-xs leading-6 text-black/45">
                            Select a recommendation to add it to this
                            session&apos;s loan history.
                          </p>
                          <button
                            type="button"
                            onClick={() => addLoanToHistory(loan)}
                            className="rounded-full bg-[#030b23] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(3,11,35,0.18)] transition hover:opacity-95"
                          >
                            Select loan
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <p className="font-mono text-xs leading-6 text-black/45">
                    {result.rejectedCount} product
                    {result.rejectedCount === 1 ? "" : "s"} filtered out by
                    deterministic eligibility rules before ranking.
                  </p>

                  <div className="rounded-[1.5rem] border border-black/8 bg-[#fafafa] p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#6f7bf7]">
                          Selected loan history
                        </p>
                        <p className="mt-2 font-mono text-sm text-black/55">
                          Temporary only. This resets when the page refreshes.
                        </p>
                      </div>

                      {selectedLoanHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedLoanHistory([])}
                          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 transition hover:border-black/20"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {selectedLoanHistory.length === 0 ? (
                      <p className="font-mono text-sm leading-7 text-black/50">
                        No loans selected yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedLoanHistory.map((loan, idx) => (
                          <div
                            key={`${loan.id}-${idx}-${loan.selectedAt}`}
                            className="rounded-2xl border border-black/8 bg-white px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">
                                  {loan.name}
                                </h4>
                                <p className="mt-1 font-mono text-sm text-black/50">
                                  {loan.provider}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-semibold text-[#111111]">
                                  {loan.aprRange}
                                </p>
                                <p className="mt-1 font-mono text-xs text-black/45">
                                  Selected at {loan.selectedAt}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
