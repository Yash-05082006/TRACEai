import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { Sparkles, TrendingDown, CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/cost-optimizer")({
  head: () => ({
    meta: [
      { title: "Optimization Agent — TRACEai" },
      {
        name: "description",
        content:
          "AI-generated, telemetry-grounded recommendations to reduce LLM spend without sacrificing quality.",
      },
    ],
  }),
  component: OptimizerPage,
});

type Confidence = "High" | "Medium" | "Low";

type Recommendation = {
  id: string;
  issue: string;
  evidence: string;
  recommendation: string;
  savings: number;
  confidence: Confidence;
  reasoning: string;
  affects: string;
  lever: string;
};

const RECS: Recommendation[] = [
  {
    id: "rec_01",
    issue:
      "GPT-4o is being used for low-complexity requests on /customer-support endpoint.",
    evidence:
      "92% of requests to /customer-support contain fewer than 300 input tokens and produce ≤120 output tokens. Across the last 30 days that is 412,840 of 449,000 requests routed to gpt-4o.",
    recommendation:
      "Route these short, single-turn requests to claude-haiku-4-5 (or gpt-4o-mini) when the input length classifier returns <300 tokens.",
    savings: 1842,
    confidence: "High",
    reasoning:
      "gpt-4o costs $5.00 / 1M input tokens vs $0.80 for haiku ($0.15 for gpt-4o-mini). Eligible volume ≈ 412.8k req/mo × 480 avg total tokens = 198M tokens shifted. Quality regression on your eval set: 1.2% on intent-classification benchmarks, well within acceptable threshold for support tier-1.",
    affects: "/customer-support · gpt-4o",
    lever: "Model right-sizing",
  },
  {
    id: "rec_02",
    issue:
      "/doc-summarizer endpoint repeats the same 1,840-token system prompt on every call.",
    evidence:
      "Telemetry shows 96,200 requests/mo to /doc-summarizer with input_tokens distribution centered at 3,140 tokens. Static prefix (schema + style rules) accounts for 1,840 tokens (58.6%) per request.",
    recommendation:
      "Move the static system prompt into Anthropic prompt caching (or OpenAI cached input). Re-issue dynamic instructions only on cache miss.",
    savings: 624,
    confidence: "High",
    reasoning:
      "Cached input tokens are billed at 10% of standard rate on Anthropic, 50% on OpenAI. At 96.2k req/mo × 1,840 cached tokens × $3.00/1M, baseline cost = $531/mo. With 90% cache hit (after 24h TTL warmup), savings ≈ 90% × 90% = 81% of the prefix cost across both providers, plus reduced TTFT.",
    affects: "/doc-summarizer · claude-sonnet-4-5",
    lever: "Prompt caching",
  },
  {
    id: "rec_03",
    issue:
      "Repeated near-duplicate embedding lookups on /search-rag are not deduplicated.",
    evidence:
      "Captured embedding requests show 28% pair-wise cosine similarity >0.96 in a 14-day window. 110,400 of 394,200 embedding calls produced effectively identical downstream retrieval sets.",
    recommendation:
      "Enable a 0.95-similarity semantic cache (24h TTL) in front of the embedding endpoint and short-circuit RAG completion when the retrieved-set hash matches a cached completion.",
    savings: 412,
    confidence: "Medium",
    reasoning:
      "Semantic cache eliminates both the embedding call ($0.02 / 1M tokens × ~840 avg = negligible) and the downstream completion call ($0.0089 avg). 110.4k saved completions × $0.0089 ≈ $982/mo gross; discounting for cache-validation overhead and 30% conservative hit-rate haircut: $412/mo net.",
    affects: "/search-rag · text-embedding-3-small + gpt-4o",
    lever: "Semantic caching",
  },
  {
    id: "rec_04",
    issue:
      "/code-assistant agent loop performs duplicate read_file tool calls within the same task.",
    evidence:
      "Agent traces show an average of 2.4 read_file calls per file per task across 54,200 monthly tasks. 38% of these calls return byte-identical responses to a call earlier in the same trace.",
    recommendation:
      "Add a per-task tool-call memoization layer keyed on (tool_name, args_hash). Skip the LLM round-trip and inject the cached tool result.",
    savings: 286,
    confidence: "Medium",
    reasoning:
      "Each duplicated tool round-trip costs ~720 completion tokens on average ($0.0036 at gpt-4o pricing). 54.2k tasks × 1.4 redundant calls × $0.0036 = $273/mo. Plus a 4–6% reduction in p95 task latency.",
    affects: "/code-assistant · gpt-4o",
    lever: "Output control",
  },
  {
    id: "rec_05",
    issue:
      "/internal-tools traffic uses GPT-4o despite being non-customer-facing and latency-tolerant.",
    evidence:
      "/internal-tools accounts for 38,400 req/mo. Eval scores for DeepSeek V3 are within 3.4% of gpt-4o on your internal benchmark set. p99 latency tolerance for this endpoint is 8s per the SLO config.",
    recommendation:
      "Route /internal-tools traffic to DeepSeek V3 (or batch API for non-realtime jobs).",
    savings: 198,
    confidence: "Low",
    reasoning:
      "DeepSeek V3 output tokens cost $1.10 / 1M vs $15.00 for gpt-4o (~14× cheaper). 38.4k req/mo × avg 1,200 output tokens × delta = $212/mo gross; net $198/mo after accounting for the eval-quality buffer.",
    affects: "/internal-tools · gpt-4o",
    lever: "Model right-sizing",
  },
];

const totalSavings = RECS.reduce((s, r) => s + r.savings, 0);
const currentSpend = 12_847;
const projected = currentSpend - totalSavings;

const confStyles: Record<Confidence, string> = {
  High: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-slate-50 text-slate-600 ring-slate-200",
};

function OptimizerPage() {
  const [filter, setFilter] = useState<"all" | Confidence>("all");
  const rows = RECS.filter((r) => filter === "all" || r.confidence === filter);

  return (
    <AppShell
      title="Optimization Agent"
      subtitle="Telemetry-grounded recommendations. Every suggestion cites the captured data it was derived from."
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#0F172A]/90">
          <Sparkles className="h-3.5 w-3.5" /> Re-run analysis
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
            Current monthly spend
          </div>
          <div className="mt-2 text-[28px] font-semibold tracking-tight text-[#0F172A]">
            ${currentSpend.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-[#64748B]">
            Trailing 30 days · across 4 providers
          </div>
        </Card>
        <Card>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
            Identified savings
          </div>
          <div className="mt-2 inline-flex items-baseline gap-2">
            <span className="text-[28px] font-semibold tracking-tight text-emerald-600">
              ${totalSavings.toLocaleString()}
            </span>
            <span className="text-[13px] font-medium text-emerald-700">/mo</span>
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-emerald-700">
            <TrendingDown className="h-3.5 w-3.5" />
            {((totalSavings / currentSpend) * 100).toFixed(1)}% reduction available
          </div>
        </Card>
        <Card>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
            Projected spend
          </div>
          <div className="mt-2 text-[28px] font-semibold tracking-tight text-[#0F172A]">
            ${projected.toLocaleString()}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#0F172A]/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              style={{ width: `${(projected / currentSpend) * 100}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold tracking-tight text-[#0F172A]">
          Recommendations
        </h2>
        <div className="inline-flex rounded-lg border border-[#0F172A]/8 bg-white p-0.5">
          {(["all", "High", "Medium", "Low"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium ${
                filter === c
                  ? "bg-[#0F172A] text-white"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {c === "all" ? "All" : `${c} confidence`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#2563EB]">
                  {r.lever}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${confStyles[r.confidence]}`}
                >
                  {r.confidence} confidence
                </span>
                <span className="text-[11px] text-[#94A3B8]">{r.affects}</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                  Expected savings
                </div>
                <div className="text-[22px] font-semibold tracking-tight text-emerald-600">
                  ${r.savings.toLocaleString()}
                  <span className="text-[12px] font-medium text-emerald-700">
                    /mo
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Field label="Problem" body={r.issue} accent="#EF4444" />
              <Field label="Evidence" body={r.evidence} accent="#2563EB" mono />
              <Field
                label="Recommendation"
                body={r.recommendation}
                accent="#10B981"
              />
              <Field
                label="Technical Reasoning"
                body={r.reasoning}
                accent="#7C3AED"
                mono
              />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#0F172A]/8 pt-3">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Grounded in live telemetry · last queried 14 min ago
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-[#0F172A]/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC]">
                  Dismiss
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0F172A]/90">
                  Apply <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function Field({
  label,
  body,
  accent,
  mono,
}: {
  label: string;
  body: string;
  accent: string;
  mono?: boolean;
}) {
  return (
    <div
      className="rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC]/60 p-3"
      style={{ borderLeft: `2px solid ${accent}` }}
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
        {label}
      </div>
      <p
        className={`text-[12px] leading-relaxed text-[#0F172A] ${mono ? "font-mono text-[11px]" : ""}`}
      >
        {body}
      </p>
    </div>
  );
}
