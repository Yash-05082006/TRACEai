import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import * as React from "react";
import { useState } from "react";
import { Filter } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { InfoTooltip } from "@/components/ui/tooltip";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "TRACEAI | Analytics" },
      {
        name: "description",
        content: "Cost, performance, reliability, and usage analytics across every LLM provider.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const TABS = [
  { id: "cost", label: "Cost", tooltip: "Analyze overall spend, cost by model, and feature attribution." },
  { id: "performance", label: "Performance", tooltip: "Monitor token generation speed, latency percentiles, and throughput." },
  { id: "reliability", label: "Reliability", tooltip: "Track error rates, rate limits, and upstream provider stability." },
  { id: "usage", label: "Usage", tooltip: "Understand traffic volume, context windows, and endpoint distribution." },
] as const;
type Tab = (typeof TABS)[number]["id"];

const ranges = ["24h", "7d", "30d", "90d"] as const;

function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("cost");
  const [range, setRange] = useState<(typeof ranges)[number]>("7d");
  const [model, setModel] = useState("all");
  const navigate = useNavigate({ from: '/analytics' });

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
                  range === r ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate({ to: '/logs', search: { time: range === '24h' ? '24h' : range === '7d' ? '7d' : '30d', fromAnalytics: true, analyticsItem: `Last ${range}` } })}
            className="inline-flex items-center gap-1 rounded-lg border border-[#0F172A]/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <Filter className="h-3.5 w-3.5" /> View in Explorer
          </button>
        </div>
      }
    >
      {model !== "all" && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#2563EB]/20 bg-[#2563EB]/5 px-3 py-2 text-[12px]">
          <span className="font-medium text-[#2563EB]">Filtered to: {model}</span>
          <button onClick={() => setModel("all")} className="ml-auto text-[#64748B] hover:text-[#0F172A] text-[11px] underline">Clear</button>
        </div>
      )}
      <div className="mb-4 flex gap-1 border-b border-[#0F172A]/8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              tab === t.id ? "text-[#0F172A] font-semibold" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {tab === t.id && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#2563EB]" />
            )}
            <span>{t.label}</span>
            {tab === t.id && <InfoTooltip content={t.tooltip} />}
          </button>
        ))}
      </div>

      {tab === "cost" && <CostTab range={range} model={model} />}
      {tab === "performance" && <PerfTab range={range} />}
      {tab === "reliability" && <ReliabilityTab range={range} />}
      {tab === "usage" && <UsageTab range={range} model={model} />}
    </AppShell>
  );
}

function ChartCard({
  title,
  hint,
  tooltip,
  children,
}: {
  title: string;
  hint: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#0F172A]">
          {title}
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        <div className="mt-0.5 text-[12px] text-[#94A3B8]">{hint}</div>
      </div>
      {children}
    </Card>
  );
}

// Pure-DOM tooltip for chart overlays (avoids SVG foreignObject issues)
function ChartTooltip({
  visible,
  x,
  y,
  children,
}: {
  visible: boolean;
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-[#0F172A]/10 bg-[#0F172A] px-3 py-2 text-center text-[11px] leading-relaxed text-white shadow-xl"
      style={{ left: x, top: y - 8 }}
    >
      {children}
      <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#0F172A]" />
    </div>
  );
}

function AreaChart({
  data,
  color = "#2563EB",
  onClick,
  formatValue,
  unit = "",
}: {
  data: number[];
  color?: string;
  onClick?: () => void;
  formatValue?: (v: number) => string;
  unit?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const w = 600;
  const h = 180;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (v / max) * (h - 16) - 8,
    v,
  }));
  const pts = points.map((p) => `${p.x},${p.y}`).join(" ");
  const id = `area-${color.replace("#", "")}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * w;
    const nearest = points.reduce((best, p, i) =>
      Math.abs(p.x - relX) < Math.abs(points[best].x - relX) ? i : best,
      0
    );
    setHoverIdx(nearest);
    const pct = points[nearest].x / w;
    const container = containerRef.current;
    if (container) {
      setTooltipPos({
        x: pct * container.offsetWidth,
        y: (points[nearest].y / h) * container.offsetHeight,
      });
    }
  };

  const fmtVal = formatValue ?? ((v: number) => `${v}${unit}`);
  const hoverPoint = hoverIdx !== null ? points[hoverIdx] : null;
  const prevVal = hoverIdx !== null && hoverIdx > 0 ? data[hoverIdx - 1] : null;
  const changePct = prevVal && hoverPoint
    ? (((hoverPoint.v - prevVal) / prevVal) * 100).toFixed(1)
    : null;

  return (
    <div ref={containerRef} className="relative">
      <ChartTooltip visible={hoverIdx !== null} x={tooltipPos.x} y={tooltipPos.y}>
        {hoverPoint && (
          <>
            <div className="font-semibold">{fmtVal(hoverPoint.v)}</div>
            {changePct && (
              <div className={`text-[10px] ${Number(changePct) >= 0 ? "text-red-300" : "text-emerald-300"}`}>
                {Number(changePct) >= 0 ? "+" : ""}{changePct}% vs prev
              </div>
            )}
          </>
        )}
      </ChartTooltip>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={`h-[180px] w-full ${onClick ? "cursor-pointer" : "cursor-crosshair"}`}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={0} x2={w} y1={h * p} y2={h * p} stroke="#0F172A" strokeOpacity="0.05" />
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
        {/* Hover crosshair + dot */}
        {hoverPoint && (
          <>
            <line
              x1={hoverPoint.x} x2={hoverPoint.x}
              y1={0} y2={h}
              stroke={color} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3,3"
            />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="6" fill="white" stroke={color} strokeWidth="2" />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="3" fill={color} />
          </>
        )}
        {/* Min/max labels */}
        <text x={4} y={12} fill="#94A3B8" fontSize="9" fontFamily="monospace">{fmtVal(max)}</text>
        <text x={4} y={h - 4} fill="#94A3B8" fontSize="9" fontFamily="monospace">{fmtVal(min)}</text>
      </svg>
    </div>
  );
}

function Bars({
  rows,
  color = "#2563EB",
  onRowClick,
  formatTooltip,
}: {
  rows: { label: string; value: number; right?: string }[];
  color?: string;
  onRowClick?: (row: { label: string; value: number }) => void;
  formatTooltip?: (row: { label: string; value: number; right?: string }) => string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-1">
      {rows.map((r, i) => (
        <li
          key={r.label}
          onClick={() => onRowClick?.(r)}
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)}
          className={`relative rounded-lg p-1.5 ${onRowClick ? "cursor-pointer" : ""} transition-colors ${hoverIdx === i ? "bg-[#0F172A]/[0.04]" : ""}`}
        >
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className={`font-medium transition-colors ${hoverIdx === i ? "text-[#2563EB]" : "text-[#0F172A]"}`}>{r.label}</span>
            <span className="text-[#64748B]">{r.right ?? r.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#0F172A]/[0.05]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.4,
              }}
            />
          </div>
          {hoverIdx === i && onRowClick && (
            <div className="mt-1 text-[10px] font-medium text-[#2563EB]">
              {formatTooltip ? formatTooltip(r) : "Click to view requests →"}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}


function CostTab({ range: _range, model: _model }: { range: string; model: string }) {
  const navigate = useNavigate({ from: "/analytics" });
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Cumulative spend"
        hint="Total cost over time · hover to inspect, click to drill into requests."
      >
        <AreaChart
          data={[12, 22, 30, 42, 56, 68, 84, 102, 118, 138, 162, 192, 220, 252, 284]}
          formatValue={(v) => `$${v}`}
          onClick={() => navigate({ to: '/logs', search: { time: '24h', fromAnalytics: true, analyticsItem: 'Cumulative spend' } })}
        />
      </ChartCard>
      <ChartCard title="Cost by feature" hint="Dollar spend attributed to each product feature.">
        <Bars
          onRowClick={(r) => navigate({ to: '/logs', search: { q: r.label, fromAnalytics: true, analyticsItem: r.label } })}
          rows={[
            { label: "doc-summarizer", value: 4820, right: "$4,820" },
            { label: "code-assistant", value: 3120, right: "$3,120" },
            { label: "customer-support", value: 1840, right: "$1,840" },
            { label: "search-rag", value: 1240, right: "$1,240" },
            { label: "internal-tools", value: 412, right: "$412" },
          ]}
        />
      </ChartCard>
      <ChartCard title="Cost by model" hint="Spend allocated across the models in your stack.">
        <Bars
          color="#0EA5E9"
          onRowClick={(r) => navigate({ to: '/logs', search: { model: r.label, fromAnalytics: true, analyticsItem: r.label } })}
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
        hint="Cumulative cost ÷ request count · hover for point value."
      >
        <AreaChart
          color="#7C3AED"
          data={[18, 19, 17, 18, 16, 17, 15, 16, 14, 15, 14, 13, 12, 13, 12]}
          formatValue={(v) => `$0.0${v}`}
          onClick={() => navigate({ to: '/logs', search: { time: '7d', fromAnalytics: true, analyticsItem: 'Avg cost per request' } })}
        />
      </ChartCard>
    </div>
  );
}

function PerfTab({ range: _range }: { range: string }) {
  const navigate = useNavigate({ from: "/analytics" });
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Latency percentiles"
        hint="End-to-end response time at p50, p95, and p99."
        tooltip="p50 = median latency (50% of requests are faster). p95 = 95th percentile (only 5% slower). p99 = worst-case tail latency."
      >
        <div className="space-y-4">
          {[
            { l: "p50", v: 612, max: 4000, c: "#10B981", tip: "50% of requests complete within 612ms" },
            { l: "p95", v: 2480, max: 4000, c: "#F59E0B", tip: "95% of requests complete within 2,480ms" },
            { l: "p99", v: 3920, max: 4000, c: "#EF4444", tip: "99% of requests complete within 3,920ms - this is your tail latency" },
          ].map((p) => (
            <button
              key={p.l}
              onClick={() => navigate({ to: '/logs', search: { time: '7d', fromAnalytics: true, analyticsItem: `Latency ${p.l.toUpperCase()}` } })}
              className="w-full text-left group"
            >
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  {p.l.toUpperCase()}
                  <InfoTooltip content={p.tip} />
                </span>
                <span className="tabular-nums font-mono text-[#64748B]">{p.v.toLocaleString()} ms</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#0F172A]/[0.05]">
                <div
                  className="h-full rounded-full transition-all duration-300 group-hover:opacity-90"
                  style={{ width: `${(p.v / p.max) * 100}%`, background: p.c }}
                />
              </div>
              <div className="mt-1 text-[10px] font-medium text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view requests at this latency range →
              </div>
            </button>
          ))}
        </div>
      </ChartCard>
      <ChartCard title="Time to first token (TTFT)" hint="Lower is better - directly affects perceived UX responsiveness.">
        <AreaChart
          color="#10B981"
          data={[420, 380, 360, 340, 320, 310, 300, 290, 280, 280, 270, 260]}
          formatValue={(v) => `${v}ms`}
          onClick={() => navigate({ to: '/logs', search: { time: '7d', fromAnalytics: true, analyticsItem: 'TTFT' } })}
        />
      </ChartCard>
      <ChartCard title="Tokens per second" hint="Output tokens generated per second - higher means faster streaming.">
        <AreaChart
          color="#0EA5E9"
          data={[42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64]}
          formatValue={(v) => `${v} tok/s`}
          onClick={() => navigate({ to: '/logs', search: { time: '7d', fromAnalytics: true, analyticsItem: 'Tokens per second' } })}
        />
      </ChartCard>
      <ChartCard title="Requests per second" hint="Sustained throughput captured by the TRACEai proxy across all providers.">
        <AreaChart
          data={[120, 140, 138, 152, 168, 180, 192, 210, 220, 234, 248, 262]}
          formatValue={(v) => `${v} req/s`}
          onClick={() => navigate({ to: '/logs', search: { time: '7d', fromAnalytics: true, analyticsItem: 'Requests per second' } })}
        />
      </ChartCard>
    </div>
  );
}

function ReliabilityTab({ range: _range }: { range: string }) {
  const navigate = useNavigate({ from: "/analytics" });
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Error rate" hint="Percentage of requests returning non-2xx HTTP status codes. High values indicate upstream issues.">
        <AreaChart
          color="#EF4444"
          data={[1.2, 0.9, 1.4, 1.1, 0.8, 0.6, 0.7, 0.5, 0.6, 0.5, 0.4, 0.4]}
          formatValue={(v) => `${v.toFixed(1)}% errors`}
          onClick={() => navigate({ to: '/logs', search: { status: 'error', fromAnalytics: true, analyticsItem: 'Error rate' } })}
        />
      </ChartCard>
      <ChartCard title="HTTP status breakdown" hint="Distribution of responses by status code.">
        <Bars
          onRowClick={(r) => navigate({ to: '/logs', search: { status: r.label.includes('200') ? 'success' : 'error', q: r.label.split(' ')[0], fromAnalytics: true, analyticsItem: r.label } })}
          rows={[
            { label: "200 OK", value: 98412, right: "98.4%" },
            { label: "429 Rate-limited", value: 942, right: "0.9%" },
            { label: "500 Server error", value: 412, right: "0.4%" },
            { label: "504 Timeout", value: 234, right: "0.2%" },
          ]}
          color="#F59E0B"
        />
      </ChartCard>
      <ChartCard
        title="Rate-limit (429) hit rate"
        hint="How often requests exceed provider quota. Sustained > 1% suggests you need a quota increase."
      >
        <AreaChart
          color="#F59E0B"
          data={[2.1, 1.8, 1.6, 1.4, 1.2, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4]}
          formatValue={(v) => `${v.toFixed(1)}% rate limited`}
          onClick={() => navigate({ to: '/logs', search: { status: 'error', q: '429', fromAnalytics: true, analyticsItem: 'Rate-limits' } })}
        />
      </ChartCard>
      <ChartCard title="Retries per request" hint="Higher values suggest upstream instability.">
        <Bars
          color="#7C3AED"
          onRowClick={() => navigate({ to: '/logs', search: { status: 'error', fromAnalytics: true, analyticsItem: 'Retries' } })}
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

function UsageTab({ range: _range, model: _model }: { range: string; model: string }) {
  const navigate = useNavigate({ from: "/analytics" });
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Requests over time" hint="Total volume of LLM requests captured by the TRACEai proxy per time bucket.">
        <AreaChart
          data={[1240, 1380, 1620, 1840, 2120, 2380, 2640, 2940, 3220, 3520, 3820, 4140]}
          formatValue={(v) => `${(v / 1000).toFixed(1)}k req`}
          onClick={() => navigate({ to: '/logs', search: { time: '7d', fromAnalytics: true, analyticsItem: 'Requests over time' } })}
        />
      </ChartCard>
      <ChartCard title="Model mix" hint="Share of requests routed to each model.">
        <Bars
          color="#0EA5E9"
          onRowClick={(r) => navigate({ to: '/logs', search: { model: r.label, fromAnalytics: true, analyticsItem: r.label } })}
          rows={[
            { label: "gpt-4o-mini", value: 42, right: "42%" },
            { label: "gpt-4o", value: 28, right: "28%" },
            { label: "claude-sonnet-4-5", value: 18, right: "18%" },
            { label: "gemini-1.5-pro", value: 8, right: "8%" },
            { label: "claude-haiku-4-5", value: 4, right: "4%" },
          ]}
        />
      </ChartCard>
      <ChartCard
        title="Avg prompt vs completion length"
        hint="Token shape across captured requests."
      >
        <Bars
          onRowClick={() => navigate({ to: '/logs', search: { fromAnalytics: true, analyticsItem: 'Token shapes' } })}
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
          onRowClick={(r) => navigate({ to: '/logs', search: { q: r.label, fromAnalytics: true, analyticsItem: r.label } })}
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
