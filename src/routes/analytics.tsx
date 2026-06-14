import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { useState } from "react";
import { Filter } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — TRACEai" },
      {
        name: "description",
        content:
          "Cost, performance, reliability, and usage analytics across every LLM provider.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const TABS = [
  { id: "cost", label: "Cost" },
  { id: "performance", label: "Performance" },
  { id: "reliability", label: "Reliability" },
  { id: "usage", label: "Usage" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const ranges = ["24h", "7d", "30d", "90d"] as const;

function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("cost");
  const [range, setRange] = useState<(typeof ranges)[number]>("7d");
  const [model, setModel] = useState("all");

  return (
    <AppShell
      title="Analytics"
      subtitle="Multi-dimensional analytics across cost, performance, reliability, and usage."
      actions={
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-[#0F172A]/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#0F172A]"
          >
            <option value="all">All models</option>
            <option>gpt-4o</option>
            <option>gpt-4o-mini</option>
            <option>claude-sonnet-4-5</option>
            <option>gemini-1.5-pro</option>
          </select>
          <div className="inline-flex rounded-lg border border-[#0F172A]/8 bg-white p-0.5">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 text-[12px] font-medium ${
                  range === r
                    ? "bg-[#0F172A] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1 rounded-lg border border-[#0F172A]/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
      }
    >
      <div className="mb-4 flex gap-1 border-b border-[#0F172A]/8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2 text-[13px] font-medium transition-colors ${
              tab === t.id ? "text-[#0F172A]" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {t.label} Analytics
            {tab === t.id && (
              <span className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-[#2563EB]" />
            )}
          </button>
        ))}
      </div>

      {tab === "cost" && <CostTab />}
      {tab === "performance" && <PerfTab />}
      {tab === "reliability" && <ReliabilityTab />}
      {tab === "usage" && <UsageTab />}
    </AppShell>
  );
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3">
        <div className="text-[14px] font-semibold text-[#0F172A]">{title}</div>
        <div className="text-[11px] text-[#94A3B8]">{hint}</div>
      </div>
      {children}
    </Card>
  );
}

function AreaChart({
  data,
  color = "#2563EB",
}: {
  data: number[];
  color?: string;
}) {
  const w = 600;
  const h = 180;
  const max = Math.max(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * (h - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ");
  const id = `area-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[180px] w-full">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
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
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Bars({
  rows,
  color = "#2563EB",
}: {
  rows: { label: string; value: number; right?: string }[];
  color?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="font-medium text-[#0F172A]">{r.label}</span>
            <span className="text-[#64748B]">{r.right ?? r.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#0F172A]/[0.05]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${color}, ${color}CC)`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function CostTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Cumulative spend"
        hint="Total cost over time · click a point to drill into that hour."
      >
        <AreaChart data={[12, 22, 30, 42, 56, 68, 84, 102, 118, 138, 162, 192, 220, 252, 284]} />
      </ChartCard>
      <ChartCard
        title="Cost by feature"
        hint="Dollar spend attributed to each product feature."
      >
        <Bars
          rows={[
            { label: "doc-summarizer", value: 4820, right: "$4,820" },
            { label: "code-assistant", value: 3120, right: "$3,120" },
            { label: "customer-support", value: 1840, right: "$1,840" },
            { label: "search-rag", value: 1240, right: "$1,240" },
            { label: "internal-tools", value: 412, right: "$412" },
          ]}
        />
      </ChartCard>
      <ChartCard
        title="Cost by model"
        hint="Spend allocated across the models in your stack."
      >
        <Bars
          color="#0EA5E9"
          rows={[
            { label: "gpt-4o", value: 5240, right: "$5,240" },
            { label: "claude-sonnet-4-5", value: 2820, right: "$2,820" },
            { label: "gemini-1.5-pro", value: 1480, right: "$1,480" },
            { label: "gpt-4o-mini", value: 624, right: "$624" },
            { label: "claude-haiku-4-5", value: 286, right: "$286" },
          ]}
        />
      </ChartCard>
      <ChartCard
        title="Avg cost per request"
        hint="Cumulative cost divided by request count · trend over time."
      >
        <AreaChart
          color="#7C3AED"
          data={[18, 19, 17, 18, 16, 17, 15, 16, 14, 15, 14, 13, 12, 13, 12]}
        />
      </ChartCard>
    </div>
  );
}

function PerfTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Latency p50 / p95 / p99" hint="End-to-end response time percentiles.">
        <div className="space-y-3">
          {[
            { l: "p50", v: 612, max: 4000, c: "#10B981" },
            { l: "p95", v: 2480, max: 4000, c: "#F59E0B" },
            { l: "p99", v: 3920, max: 4000, c: "#EF4444" },
          ].map((p) => (
            <div key={p.l}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#0F172A]">{p.l}</span>
                <span className="text-[#64748B]">{p.v} ms</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#0F172A]/[0.05]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(p.v / p.max) * 100}%`, background: p.c }}
                />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
      <ChartCard title="Time to first token (TTFT)" hint="Lower is better — affects perceived UX.">
        <AreaChart color="#10B981" data={[420, 380, 360, 340, 320, 310, 300, 290, 280, 280, 270, 260]} />
      </ChartCard>
      <ChartCard title="Tokens per second" hint="Throughput — output tokens generated per second.">
        <AreaChart color="#0EA5E9" data={[42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64]} />
      </ChartCard>
      <ChartCard title="Requests per second" hint="Sustained throughput across providers.">
        <AreaChart data={[120, 140, 138, 152, 168, 180, 192, 210, 220, 234, 248, 262]} />
      </ChartCard>
    </div>
  );
}

function ReliabilityTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Error rate" hint="Share of requests returning non-2xx status.">
        <AreaChart color="#EF4444" data={[1.2, 0.9, 1.4, 1.1, 0.8, 0.6, 0.7, 0.5, 0.6, 0.5, 0.4, 0.4]} />
      </ChartCard>
      <ChartCard title="HTTP status breakdown" hint="Distribution of responses by status code.">
        <Bars
          rows={[
            { label: "200 OK", value: 98412, right: "98.4%" },
            { label: "429 Rate-limited", value: 942, right: "0.9%" },
            { label: "500 Server error", value: 412, right: "0.4%" },
            { label: "504 Timeout", value: 234, right: "0.2%" },
          ]}
          color="#F59E0B"
        />
      </ChartCard>
      <ChartCard title="Rate-limit (429) hit rate" hint="Indicates approaching provider quota ceiling.">
        <AreaChart color="#F59E0B" data={[2.1, 1.8, 1.6, 1.4, 1.2, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4]} />
      </ChartCard>
      <ChartCard title="Retries per request" hint="Higher values suggest upstream instability.">
        <Bars
          color="#7C3AED"
          rows={[
            { label: "0 retries", value: 92 },
            { label: "1 retry", value: 6 },
            { label: "2 retries", value: 1.5 },
            { label: "3+ retries", value: 0.5 },
          ]}
        />
      </ChartCard>
    </div>
  );
}

function UsageTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Requests over time" hint="Volume captured by the proxy.">
        <AreaChart data={[1240, 1380, 1620, 1840, 2120, 2380, 2640, 2940, 3220, 3520, 3820, 4140]} />
      </ChartCard>
      <ChartCard title="Model mix" hint="Share of requests routed to each model.">
        <Bars
          color="#0EA5E9"
          rows={[
            { label: "gpt-4o-mini", value: 42, right: "42%" },
            { label: "gpt-4o", value: 28, right: "28%" },
            { label: "claude-sonnet-4-5", value: 18, right: "18%" },
            { label: "gemini-1.5-pro", value: 8, right: "8%" },
            { label: "claude-haiku-4-5", value: 4, right: "4%" },
          ]}
        />
      </ChartCard>
      <ChartCard title="Avg prompt vs completion length" hint="Token shape across captured requests.">
        <Bars
          rows={[
            { label: "Avg input tokens", value: 824, right: "824" },
            { label: "Avg output tokens", value: 312, right: "312" },
            { label: "Avg total tokens", value: 1136, right: "1,136" },
          ]}
        />
      </ChartCard>
      <ChartCard title="Endpoint mix" hint="Traffic split by feature / endpoint.">
        <Bars
          color="#10B981"
          rows={[
            { label: "/chat/completions", value: 62, right: "62%" },
            { label: "/messages", value: 24, right: "24%" },
            { label: "/embeddings", value: 10, right: "10%" },
            { label: "/responses", value: 4, right: "4%" },
          ]}
        />
      </ChartCard>
    </div>
  );
}
