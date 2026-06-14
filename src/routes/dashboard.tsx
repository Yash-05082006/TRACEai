import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, ArrowDownRight, ArrowUpRight, Activity } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — TRACEai" },
      {
        name: "description",
        content:
          "Real-time LLM observability overview: requests, tokens, cost, latency, and error rate.",
      },
    ],
  }),
  component: OverviewPage,
});

const ranges = ["1h", "24h", "7d", "30d"] as const;
type Range = (typeof ranges)[number];

type Metric = {
  key: string;
  label: string;
  value: string;
  delta: number;
  definition: string;
  why: string;
  spark: number[];
  format: "neutral" | "lowerBetter";
};

const metricsByRange: Record<Range, Metric[]> = {
  "1h": [
    { key: "req", label: "Total Requests", value: "12,847", delta: 4.2, definition: "Number of LLM API calls captured by the TRACEai proxy in the selected window.", why: "Volume is the denominator for cost, latency, and error analysis. Sudden changes signal traffic shifts.", spark: [40, 42, 38, 45, 50, 48, 55, 58, 60, 64, 62, 70], format: "neutral" },
    { key: "tok", label: "Total Tokens", value: "8.42M", delta: 6.1, definition: "Sum of input + output tokens across every captured request.", why: "Tokens are the unit of LLM billing. Spikes here drive cost.", spark: [30, 35, 33, 42, 50, 48, 55, 60, 58, 66, 72, 78], format: "neutral" },
    { key: "cost", label: "Total Cost", value: "$184.20", delta: 8.4, definition: "Tokens × per-model price, summed across all captured requests.", why: "The headline metric for finance and engineering leadership.", spark: [22, 26, 30, 28, 34, 38, 42, 40, 48, 52, 56, 60], format: "neutral" },
    { key: "lat", label: "Avg Latency", value: "842 ms", delta: -3.1, definition: "Mean end-to-end response time from request received by proxy to final token returned.", why: "User-facing performance — high latency degrades product UX.", spark: [60, 58, 62, 56, 54, 58, 52, 50, 48, 50, 46, 44], format: "lowerBetter" },
    { key: "err", label: "Error Rate", value: "0.42%", delta: -0.8, definition: "Share of requests that returned a non-2xx status from the upstream provider.", why: "Errors indicate quota, rate-limit, or provider-side outages. Low is healthy.", spark: [12, 14, 10, 9, 8, 11, 9, 7, 6, 5, 6, 5], format: "lowerBetter" },
  ],
  "24h": [
    { key: "req", label: "Total Requests", value: "284,193", delta: 2.8, definition: "Number of LLM API calls captured by the TRACEai proxy in the selected window.", why: "Volume is the denominator for cost, latency, and error analysis.", spark: [30, 40, 38, 44, 52, 50, 58, 62, 60, 66, 70, 74], format: "neutral" },
    { key: "tok", label: "Total Tokens", value: "182.4M", delta: 5.2, definition: "Sum of input + output tokens across every captured request.", why: "Tokens are the unit of LLM billing. Spikes here drive cost.", spark: [28, 30, 36, 40, 44, 48, 52, 55, 60, 64, 70, 76], format: "neutral" },
    { key: "cost", label: "Total Cost", value: "$4,128", delta: 7.6, definition: "Tokens × per-model price, summed across all captured requests.", why: "The headline metric for finance and engineering leadership.", spark: [24, 28, 30, 34, 36, 40, 44, 48, 52, 56, 60, 66], format: "neutral" },
    { key: "lat", label: "Avg Latency", value: "918 ms", delta: 1.4, definition: "Mean end-to-end response time from request received by proxy to final token returned.", why: "User-facing performance — high latency degrades product UX.", spark: [50, 52, 50, 54, 56, 52, 58, 60, 56, 58, 60, 62], format: "lowerBetter" },
    { key: "err", label: "Error Rate", value: "0.61%", delta: 0.2, definition: "Share of requests that returned a non-2xx status from the upstream provider.", why: "Errors indicate quota, rate-limit, or provider-side outages.", spark: [10, 9, 11, 10, 12, 11, 10, 12, 13, 11, 12, 13], format: "lowerBetter" },
  ],
  "7d": [
    { key: "req", label: "Total Requests", value: "1.84M", delta: 12.4, definition: "Number of LLM API calls captured by the TRACEai proxy in the selected window.", why: "Volume is the denominator for cost, latency, and error analysis.", spark: [40, 44, 50, 56, 60, 66, 70, 74, 78, 82, 86, 92], format: "neutral" },
    { key: "tok", label: "Total Tokens", value: "1.21B", delta: 14.8, definition: "Sum of input + output tokens across every captured request.", why: "Tokens are the unit of LLM billing.", spark: [30, 36, 40, 48, 54, 60, 66, 72, 78, 84, 90, 96], format: "neutral" },
    { key: "cost", label: "Total Cost", value: "$28,940", delta: 18.2, definition: "Tokens × per-model price, summed across all captured requests.", why: "The headline metric for finance and engineering leadership.", spark: [26, 30, 34, 38, 44, 52, 58, 64, 70, 78, 84, 90], format: "neutral" },
    { key: "lat", label: "Avg Latency", value: "904 ms", delta: -2.4, definition: "Mean end-to-end response time from request received by proxy to final token returned.", why: "User-facing performance.", spark: [60, 62, 58, 60, 56, 58, 54, 56, 52, 54, 52, 50], format: "lowerBetter" },
    { key: "err", label: "Error Rate", value: "0.58%", delta: -0.4, definition: "Share of requests that returned a non-2xx status.", why: "Errors indicate quota, rate-limit, or outages.", spark: [12, 11, 10, 11, 9, 10, 9, 8, 9, 8, 7, 8], format: "lowerBetter" },
  ],
  "30d": [
    { key: "req", label: "Total Requests", value: "8.12M", delta: 22.6, definition: "Number of LLM API calls captured by the TRACEai proxy in the selected window.", why: "Volume is the denominator for cost, latency, and error analysis.", spark: [30, 36, 42, 50, 56, 62, 68, 72, 78, 84, 90, 96], format: "neutral" },
    { key: "tok", label: "Total Tokens", value: "5.34B", delta: 26.4, definition: "Sum of input + output tokens.", why: "Tokens drive cost.", spark: [28, 34, 40, 48, 56, 64, 70, 76, 82, 88, 94, 100], format: "neutral" },
    { key: "cost", label: "Total Cost", value: "$128,470", delta: 31.2, definition: "Tokens × per-model price.", why: "Headline metric for finance.", spark: [22, 28, 34, 40, 48, 56, 64, 70, 78, 86, 92, 98], format: "neutral" },
    { key: "lat", label: "Avg Latency", value: "886 ms", delta: -4.8, definition: "Mean end-to-end response time.", why: "User-facing performance.", spark: [62, 60, 58, 58, 56, 54, 52, 52, 50, 48, 48, 46], format: "lowerBetter" },
    { key: "err", label: "Error Rate", value: "0.52%", delta: -1.1, definition: "Share of requests returning non-2xx.", why: "Indicates quota / rate-limit / outages.", spark: [14, 13, 12, 11, 11, 10, 9, 8, 8, 7, 7, 6], format: "lowerBetter" },
  ],
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 120;
  const h = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / Math.max(1, max - min)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const color = positive ? "#10B981" : "#EF4444";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`url(#sg-${color})`}
      />
    </svg>
  );
}

function OverviewPage() {
  const [range, setRange] = useState<Range>("24h");
  const metrics = metricsByRange[range];

  return (
    <AppShell
      title="Overview"
      subtitle="Live telemetry across every connected LLM provider — captured by the TRACEai proxy."
      actions={
        <div className="inline-flex rounded-lg border border-[#0F172A]/8 bg-white p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                range === r
                  ? "bg-[#0F172A] text-white"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((m) => {
            const isGood =
              m.format === "lowerBetter" ? m.delta <= 0 : m.delta >= 0;
            return (
              <Card key={m.key} className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                      {m.label}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-[#94A3B8] hover:text-[#475569]">
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="max-w-[260px] text-left"
                      >
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                          Definition
                        </div>
                        <div className="mb-2 text-[12px] leading-relaxed text-[#0F172A]">
                          {m.definition}
                        </div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                          Why it matters
                        </div>
                        <div className="text-[12px] leading-relaxed text-[#475569]">
                          {m.why}
                        </div>
                        <div className="mt-2 border-t border-[#0F172A]/8 pt-2 text-[11px] text-[#94A3B8]">
                          Window: {range}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isGood
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {m.delta >= 0 ? (
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    ) : (
                      <ArrowDownRight className="h-2.5 w-2.5" />
                    )}
                    {Math.abs(m.delta).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[26px] font-semibold tracking-tight text-[#0F172A]">
                  {m.value}
                </div>
                <Sparkline data={m.spark} positive={isGood} />
              </Card>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold text-[#0F172A]">
                  Spend over time
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  Cumulative cost across providers · {range}
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <Activity className="h-3 w-3 text-[#2563EB]" />
                Streaming
              </span>
            </div>
            <SpendChart />
          </Card>
          <Card>
            <div className="mb-3 text-[14px] font-semibold text-[#0F172A]">
              Cost by provider
            </div>
            <ul className="space-y-3">
              {[
                { name: "OpenAI", pct: 58, amount: "$2,394" },
                { name: "Anthropic", pct: 28, amount: "$1,156" },
                { name: "Google Gemini", pct: 9, amount: "$372" },
                { name: "DeepSeek", pct: 5, amount: "$206" },
              ].map((p) => (
                <li key={p.name}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#0F172A]">
                      {p.name}
                    </span>
                    <span className="text-[#64748B]">
                      {p.amount} · {p.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#0F172A]/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#0EA5E9]"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </TooltipProvider>
    </AppShell>
  );
}

function SpendChart() {
  const data = [
    12, 18, 22, 28, 36, 44, 50, 58, 64, 72, 78, 84, 92, 100, 108, 118, 128,
    138, 150, 162, 174, 188, 202, 220,
  ];
  const w = 720;
  const h = 220;
  const max = Math.max(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * (h - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[220px] w-full">
      <defs>
        <linearGradient id="spend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={0}
          x2={w}
          y1={h * p}
          y2={h * p}
          stroke="#0F172A"
          strokeOpacity="0.05"
        />
      ))}
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#spend-fill)" />
      <polyline
        points={pts}
        fill="none"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
