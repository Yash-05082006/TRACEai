import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { InfoTooltip } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, AlertTriangle, ServerCrash, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

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

function OverviewPage() {
  const [range, setRange] = useState<Range>("24h");
  const navigate = useNavigate();

  return (
    <AppShell
      title="Overview"
      subtitle="Executive summary of your LLM operations, cost efficiency, and reliability."
      actions={
        <div className="inline-flex rounded-lg border border-[#0F172A]/8 bg-white p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                range === r ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Monthly Spend", value: "$10,080", sub: `+8.4% vs prev period`, positive: false },
          { label: "Requests Processed", value: "483,920", sub: "+12.1% vs prev period", positive: true },
          { label: "Error Rate", value: "0.41%", sub: "↓ 0.12pp this week", positive: true },
          { label: "P95 Latency", value: "2,480ms", sub: "↑ 140ms vs last week", positive: false },
        ].map((kpi) => (
          <Card key={kpi.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              {kpi.label}
            </div>
            <div className="mt-1 text-[24px] font-bold tracking-tight text-[#0F172A]">{kpi.value}</div>
            <div className={`text-[11px] font-medium ${kpi.positive ? "text-emerald-600" : "text-red-500"}`}>
              {kpi.sub}
            </div>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Key Insights */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">
                Key Insights
              </h2>
              <InfoTooltip content="AI-generated insights highlighting significant changes in your LLM usage patterns, costs, and performance." />
            </div>
            <ul className="space-y-4">
              <InsightItem
                icon={<TrendingUp className="h-4 w-4 text-amber-600" />}
                bg="bg-amber-50"
                title="Cost spike detected on /doc-summarizer"
                desc="Spend increased by 24% over the last 48 hours, driven by a 15% increase in average input token length. Consider caching the system prompt."
              />
              <InsightItem
                icon={<Zap className="h-4 w-4 text-emerald-600" />}
                bg="bg-emerald-50"
                title="Semantic Cache hit rate improved"
                desc="Cache hit rate for /search-rag reached 32% today, saving approximately $14.20 and reducing P50 latency by 410ms."
              />
              <InsightItem
                icon={<TrendingDown className="h-4 w-4 text-emerald-600" />}
                bg="bg-emerald-50"
                title="Latency dropping on Claude 3.5 Sonnet"
                desc="Average TTFT (Time to First Token) has dropped by 18% since yesterday. Upstream provider performance has stabilized."
              />
            </ul>
          </Card>

          {/* Reliability Alerts */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">
                Reliability Alerts
              </h2>
              <InfoTooltip content="Active errors, rate limits, or timeouts detected in your traffic that require immediate attention." />
            </div>
            <button
              onClick={() => navigate({ to: '/logs', search: { status: 'error', provider: 'OpenAI', fromAnalytics: true, analyticsItem: 'OpenAI Rate Limits' } })}
              className="text-left w-full rounded-xl border border-red-200 bg-red-50 p-4 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <h3 className="text-[13px] font-semibold text-red-900">
                    High Rate Limiting (429) on OpenAI
                  </h3>
                  <p className="mt-1 text-[12px] text-red-800">
                    Your OpenAI organization hit the TPM (Tokens Per Minute) limit 42 times in the
                    last hour.
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[12px] font-medium text-red-700">
                    <span>
                      Affects:{" "}
                      <code className="font-mono bg-red-100 px-1 py-0.5 rounded">gpt-4o</code>
                    </span>
                    <span className="underline">View failed requests →</span>
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate({ to: '/logs', search: { status: 'error', provider: 'Anthropic', fromAnalytics: true, analyticsItem: 'Anthropic Timeouts' } })}
              className="text-left w-full rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <ServerCrash className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <h3 className="text-[13px] font-semibold text-amber-900">
                    Elevated Gateway Timeouts (504)
                  </h3>
                  <p className="mt-1 text-[12px] text-amber-800">
                    Anthropic API has returned 504 Gateway Timeout for 12 requests in the last 6
                    hours on large context queries.
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-amber-700 underline">View affected requests →</p>
                </div>
              </div>
            </button>
          </Card>
        </div>

        {/* Right Column: Drivers & Health (1/3 width) */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Cost Drivers */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">
                Cost Drivers
              </h2>
              <InfoTooltip content="Breakdown of your spend by endpoint or model. Identifies where your budget is actually going." />
            </div>
            <div className="space-y-4">
              <CostDriver
                name="/code-assistant"
                amount="$4,210"
                pct={42}
                color="from-indigo-500 to-indigo-600"
                onClick={() => navigate({ to: '/logs', search: { q: 'code-assistant', fromAnalytics: true, analyticsItem: '/code-assistant' } })}
              />
              <CostDriver
                name="/doc-summarizer"
                amount="$2,840"
                pct={28}
                color="from-blue-500 to-blue-600"
                onClick={() => navigate({ to: '/logs', search: { q: 'doc-summarizer', fromAnalytics: true, analyticsItem: '/doc-summarizer' } })}
              />
              <CostDriver
                name="/search-rag"
                amount="$1,920"
                pct={19}
                color="from-emerald-500 to-emerald-600"
                onClick={() => navigate({ to: '/logs', search: { q: 'search-rag', fromAnalytics: true, analyticsItem: '/search-rag' } })}
              />
              <CostDriver
                name="/customer-support"
                amount="$1,110"
                pct={11}
                color="from-amber-500 to-amber-600"
                onClick={() => navigate({ to: '/logs', search: { q: 'customer-support', fromAnalytics: true, analyticsItem: '/customer-support' } })}
              />
            </div>
          </Card>

          {/* Provider Health */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">
                Provider Health
              </h2>
              <InfoTooltip content="Real-time status and latency percentiles for the upstream LLM providers you are connected to." />
            </div>
            <div className="divide-y divide-[#0F172A]/8 border-t border-[#0F172A]/8">
              <HealthRow provider="OpenAI" status="Degraded" lat="1,240ms" isWarning
                onClick={() => navigate({ to: '/logs', search: { provider: 'OpenAI', status: 'error', fromAnalytics: true, analyticsItem: 'OpenAI Health' } })} />
              <HealthRow provider="Anthropic" status="Healthy" lat="840ms"
                onClick={() => navigate({ to: '/logs', search: { provider: 'Anthropic', fromAnalytics: true, analyticsItem: 'Anthropic Health' } })} />
              <HealthRow provider="Google Gemini" status="Healthy" lat="620ms"
                onClick={() => navigate({ to: '/logs', search: { provider: 'Google', fromAnalytics: true, analyticsItem: 'Google Health' } })} />
              <HealthRow provider="DeepSeek" status="Healthy" lat="480ms"
                onClick={() => navigate({ to: '/logs', search: { provider: 'DeepSeek', fromAnalytics: true, analyticsItem: 'DeepSeek Health' } })} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}


function InsightItem({
  icon,
  bg,
  title,
  desc,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-3">
      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${bg}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-[13px] font-semibold text-[#0F172A]">{title}</h3>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[#64748B]">{desc}</p>
      </div>
    </li>
  );
}

function CostDriver({
  name,
  amount,
  pct,
  color,
  onClick,
}: {
  name: string;
  amount: string;
  pct: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left group">
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{name}</span>
        <span className="text-[#64748B]">
          {amount} <span className="font-mono text-[#94A3B8]">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#0F172A]/[0.05]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

function HealthRow({
  provider,
  status,
  lat,
  isWarning,
  onClick,
}: {
  provider: string;
  status: string;
  lat: string;
  isWarning?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-3 text-[12px] hover:bg-[#0F172A]/[0.03] -mx-1 px-1 rounded-lg transition-colors">
      <div className="flex items-center gap-2 font-medium text-[#0F172A]">
        <div
          className={`h-2 w-2 rounded-full ${isWarning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
        />
        {provider}
      </div>
      <div className="flex items-center gap-3">
        <span className={isWarning ? "text-amber-600 font-medium" : "text-[#64748B]"}>
          {status}
        </span>
        <span className="font-mono text-[#94A3B8]">p99: {lat}</span>
      </div>
    </button>
  );
}
