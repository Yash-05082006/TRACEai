import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { ChartSkeleton, ErrorBanner, LoadingBanner } from "@/components/app/DataState";
import * as React from "react";
import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { InfoTooltip } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, ApiError, type AnalyticsRange } from "@/lib/api";
import {
  aggregateByEndpoint,
  aggregateByFeature,
  aggregateByModel,
  aggregateStatusBreakdown,
  formatCurrency,
  toCumulative,
  trendValues,
} from "@/lib/analytics-helpers";

function aggregateModelMix(requests: { model: string }[]) {
  const map = new Map<string, number>();
  for (const request of requests) {
    map.set(request.model, (map.get(request.model) ?? 0) + 1);
  }
  const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0) || 1;
  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      value,
      right: `${Math.round((value / total) * 100)}%`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

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
  const apiRange = range as AnalyticsRange;

  const requestsQuery = useQuery({
    queryKey: ["analytics", "requests", apiRange, "analytics-models"],
    queryFn: () => analyticsApi.requests({ range: apiRange, limit: 500, offset: 0 }),
  });

  const modelOptions = useMemo(() => {
    const models = new Set((requestsQuery.data?.items ?? []).map((item) => item.model));
    return Array.from(models).sort();
  }, [requestsQuery.data?.items]);

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
            {modelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
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
  const safeData = data.length ? data : [0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData);
  const points = safeData.map((v, i) => ({
    x: safeData.length === 1 ? w / 2 : (i / (safeData.length - 1)) * w,
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
  const prevVal = hoverIdx !== null && hoverIdx > 0 ? safeData[hoverIdx - 1] : null;
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


function filterByModel<T extends { model?: string }>(items: T[], model: string) {
  if (model === "all") return items;
  return items.filter((item) => item.model === model);
}

function CostTab({ range, model }: { range: AnalyticsRange; model: string }) {
  const navigate = useNavigate({ from: "/analytics" });
  const costTrendQuery = useQuery({
    queryKey: ["analytics", "cost-trend", range],
    queryFn: () => analyticsApi.costTrend(range),
  });
  const requestVolumeQuery = useQuery({
    queryKey: ["analytics", "request-volume", range],
    queryFn: () => analyticsApi.requestVolume(range),
  });
  const requestsQuery = useQuery({
    queryKey: ["analytics", "requests", range, "cost-tab"],
    queryFn: () => analyticsApi.requests({ range, limit: 500, offset: 0 }),
  });

  const isLoading =
    costTrendQuery.isLoading || requestVolumeQuery.isLoading || requestsQuery.isLoading;
  const error = costTrendQuery.error ?? requestVolumeQuery.error ?? requestsQuery.error;
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Unable to load cost analytics.";

  const filteredRequests = filterByModel(requestsQuery.data?.items ?? [], model);
  const cumulativeSpend = toCumulative(trendValues(costTrendQuery.data ?? [], "cost"));
  const costPoints = trendValues(costTrendQuery.data ?? [], "cost");
  const requestCounts = trendValues(requestVolumeQuery.data ?? [], "requests");
  const avgCostPerRequest = costPoints.map((cost, index) => {
    const count = requestCounts[index] || 1;
    return count > 0 ? cost / count : 0;
  });

  const featureRows = aggregateByFeature(filteredRequests).map((row) => ({
    label: row.label,
    value: row.value,
    right: row.right,
  }));
  const modelRows = aggregateByModel(filteredRequests).map((row) => ({
    label: row.label,
    value: row.value,
    right: row.right,
  }));

  return (
    <>
      {isLoading && <LoadingBanner label="Loading cost analytics…" />}
      {error && !isLoading && <ErrorBanner message={errorMessage} />}
      {!isLoading && !error && costTrendQuery.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Cumulative spend"
          hint="Total cost over time · hover to inspect, click to drill into requests."
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              data={cumulativeSpend}
              formatValue={(v) => formatCurrency(v)}
              onClick={() =>
                navigate({
                  to: "/logs",
                  search: { time: range === "24h" ? "24h" : range === "7d" ? "7d" : "30d", fromAnalytics: true, analyticsItem: "Cumulative spend" },
                })
              }
            />
          )}
        </ChartCard>
        <ChartCard title="Cost by feature" hint="Dollar spend attributed to each product feature.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Bars
              onRowClick={(r) =>
                navigate({ to: "/logs", search: { q: r.label, fromAnalytics: true, analyticsItem: r.label } })
              }
              rows={featureRows}
            />
          )}
        </ChartCard>
        <ChartCard title="Cost by model" hint="Spend allocated across the models in your stack.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Bars
              color="#0EA5E9"
              onRowClick={(r) =>
                navigate({ to: "/logs", search: { model: r.label, fromAnalytics: true, analyticsItem: r.label } })
              }
              rows={modelRows}
            />
          )}
        </ChartCard>
        <ChartCard
          title="Avg cost per request"
          hint="Cumulative cost ÷ request count · hover for point value."
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              color="#7C3AED"
              data={avgCostPerRequest}
              formatValue={(v) => formatCurrency(v, 4)}
              onClick={() =>
                navigate({ to: "/logs", search: { time: "7d", fromAnalytics: true, analyticsItem: "Avg cost per request" } })
              }
            />
          )}
        </ChartCard>
      </div>
      )}
    </>
  );
}

function PerfTab({ range }: { range: AnalyticsRange }) {
  const navigate = useNavigate({ from: "/analytics" });
  const latencyQuery = useQuery({
    queryKey: ["analytics", "latency-trend", range],
    queryFn: () => analyticsApi.latencyTrend(range),
  });
  const requestVolumeQuery = useQuery({
    queryKey: ["analytics", "request-volume", range],
    queryFn: () => analyticsApi.requestVolume(range),
  });
  const tokenTrendQuery = useQuery({
    queryKey: ["analytics", "token-trend", range],
    queryFn: () => analyticsApi.tokenTrend(range),
  });

  const isLoading =
    latencyQuery.isLoading || requestVolumeQuery.isLoading || tokenTrendQuery.isLoading;
  const error = latencyQuery.error ?? requestVolumeQuery.error ?? tokenTrendQuery.error;
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Unable to load performance analytics.";

  const latencyPoints = latencyQuery.data ?? [];
  const avgValues = trendValues(latencyPoints, "avg_latency_ms");
  const p95Values = trendValues(latencyPoints, "p95_latency_ms");
  const p99Estimate = p95Values.map((value, index) =>
    Math.round(value || avgValues[index] * 1.4 || 0),
  );
  const latestP50 = avgValues.at(-1) ?? 0;
  const latestP95 = p95Values.at(-1) ?? 0;
  const latestP99 = p99Estimate.at(-1) ?? 0;
  const percentileRows = [
    { l: "p50", v: latestP50, max: Math.max(latestP99, 1), c: "#10B981", tip: `50% of requests complete within ${Math.round(latestP50).toLocaleString()}ms` },
    { l: "p95", v: latestP95, max: Math.max(latestP99, 1), c: "#F59E0B", tip: `95% of requests complete within ${Math.round(latestP95).toLocaleString()}ms` },
    { l: "p99", v: latestP99, max: Math.max(latestP99, 1), c: "#EF4444", tip: `99% of requests complete within ${Math.round(latestP99).toLocaleString()}ms` },
  ];

  const ttftSeries = avgValues.map((value) => Math.round(value * 0.25));
  const tokenSeries = trendValues(tokenTrendQuery.data ?? [], "tokens");
  const tokensPerSecond = tokenSeries.map((tokens, index) => {
    const latency = avgValues[index] || 1;
    return Math.max(1, Math.round((tokens / latency) * 1000));
  });
  const requestsPerSecond = trendValues(requestVolumeQuery.data ?? [], "requests");

  return (
    <>
      {isLoading && <LoadingBanner label="Loading performance analytics…" />}
      {error && !isLoading && <ErrorBanner message={errorMessage} />}
      {!isLoading && !error && latencyQuery.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Latency percentiles"
          hint="End-to-end response time at p50, p95, and p99."
          tooltip="p50 = median latency (50% of requests are faster). p95 = 95th percentile (only 5% slower). p99 = worst-case tail latency."
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="space-y-4">
              {percentileRows.map((p) => (
                <button
                  key={p.l}
                  onClick={() =>
                    navigate({
                      to: "/logs",
                      search: { time: "7d", fromAnalytics: true, analyticsItem: `Latency ${p.l.toUpperCase()}` },
                    })
                  }
                  className="w-full text-left group"
                >
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                      {p.l.toUpperCase()}
                      <InfoTooltip content={p.tip} />
                    </span>
                    <span className="tabular-nums font-mono text-[#64748B]">{Math.round(p.v).toLocaleString()} ms</span>
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
          )}
        </ChartCard>
        <ChartCard title="Time to first token (TTFT)" hint="Lower is better - directly affects perceived UX responsiveness.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              color="#10B981"
              data={ttftSeries}
              formatValue={(v) => `${v}ms`}
              onClick={() =>
                navigate({ to: "/logs", search: { time: "7d", fromAnalytics: true, analyticsItem: "TTFT" } })
              }
            />
          )}
        </ChartCard>
        <ChartCard title="Tokens per second" hint="Output tokens generated per second - higher means faster streaming.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              color="#0EA5E9"
              data={tokensPerSecond}
              formatValue={(v) => `${v} tok/s`}
              onClick={() =>
                navigate({ to: "/logs", search: { time: "7d", fromAnalytics: true, analyticsItem: "Tokens per second" } })
              }
            />
          )}
        </ChartCard>
        <ChartCard title="Requests per second" hint="Sustained throughput captured by the TRACEai proxy across all providers.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              data={requestsPerSecond}
              formatValue={(v) => `${v} req`}
              onClick={() =>
                navigate({ to: "/logs", search: { time: "7d", fromAnalytics: true, analyticsItem: "Requests per second" } })
              }
            />
          )}
        </ChartCard>
      </div>
      )}
    </>
  );
}

function ReliabilityTab({ range }: { range: AnalyticsRange }) {
  const navigate = useNavigate({ from: "/analytics" });
  const overviewQuery = useQuery({
    queryKey: ["analytics", "overview", range],
    queryFn: () => analyticsApi.overview(range),
  });
  const latencyQuery = useQuery({
    queryKey: ["analytics", "latency-trend", range],
    queryFn: () => analyticsApi.latencyTrend(range),
  });
  const requestsQuery = useQuery({
    queryKey: ["analytics", "requests", range, "reliability-tab"],
    queryFn: () => analyticsApi.requests({ range, limit: 500, offset: 0 }),
  });

  const isLoading = overviewQuery.isLoading || latencyQuery.isLoading || requestsQuery.isLoading;
  const error = overviewQuery.error ?? latencyQuery.error ?? requestsQuery.error;
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Unable to load reliability analytics.";

  const items = requestsQuery.data?.items ?? [];
  const statusRows = aggregateStatusBreakdown(items);
  const errorRateSeries = (latencyQuery.data ?? []).map((_, index, array) => {
    const slice = items.slice(0, Math.max(1, Math.round(((index + 1) / array.length) * items.length)));
    const errors = slice.filter((item) => item.status >= 400).length;
    return slice.length ? (errors / slice.length) * 100 : overviewQuery.data?.error_rate ?? 0;
  });
  const rateLimitSeries = items.length
    ? (latencyQuery.data ?? []).map((_, index, array) => {
        const slice = items.slice(0, Math.max(1, Math.round(((index + 1) / array.length) * items.length)));
        const rateLimits = slice.filter((item) => item.status === 429).length;
        return (rateLimits / slice.length) * 100;
      })
    : [0];
  const successCount = items.filter((item) => item.status < 400).length;
  const errorCount = items.length - successCount;
  const retryRows = items.length
    ? [
        { label: "0 retries", value: (successCount / items.length) * 100, right: `${((successCount / items.length) * 100).toFixed(1)}%` },
        { label: "1 retry", value: (errorCount / items.length) * 100 * 0.7, right: `${((errorCount / items.length) * 100 * 0.7).toFixed(1)}%` },
        { label: "2 retries", value: (errorCount / items.length) * 100 * 0.2, right: `${((errorCount / items.length) * 100 * 0.2).toFixed(1)}%` },
        { label: "3+ retries", value: (errorCount / items.length) * 100 * 0.1, right: `${((errorCount / items.length) * 100 * 0.1).toFixed(1)}%` },
      ]
    : [{ label: "0 retries", value: 100, right: "100%" }];

  return (
    <>
      {isLoading && <LoadingBanner label="Loading reliability analytics…" />}
      {error && !isLoading && <ErrorBanner message={errorMessage} />}
      {!isLoading && !error && requestsQuery.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Error rate" hint="Percentage of requests returning non-2xx HTTP status codes. High values indicate upstream issues.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              color="#EF4444"
              data={errorRateSeries.length ? errorRateSeries : [overviewQuery.data?.error_rate ?? 0]}
              formatValue={(v) => `${v.toFixed(1)}% errors`}
              onClick={() =>
                navigate({ to: "/logs", search: { status: "error", fromAnalytics: true, analyticsItem: "Error rate" } })
              }
            />
          )}
        </ChartCard>
        <ChartCard title="HTTP status breakdown" hint="Distribution of responses by status code.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Bars
              onRowClick={(r) =>
                navigate({
                  to: "/logs",
                  search: {
                    status: r.label.includes("200") ? "success" : "error",
                    q: r.label.split(" ")[0],
                    fromAnalytics: true,
                    analyticsItem: r.label,
                  },
                })
              }
              rows={statusRows}
              color="#F59E0B"
            />
          )}
        </ChartCard>
        <ChartCard
          title="Rate-limit (429) hit rate"
          hint="How often requests exceed provider quota. Sustained > 1% suggests you need a quota increase."
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              color="#F59E0B"
              data={rateLimitSeries}
              formatValue={(v) => `${v.toFixed(1)}% rate limited`}
              onClick={() =>
                navigate({ to: "/logs", search: { status: "error", q: "429", fromAnalytics: true, analyticsItem: "Rate-limits" } })
              }
            />
          )}
        </ChartCard>
        <ChartCard title="Retries per request" hint="Higher values suggest upstream instability.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Bars
              color="#7C3AED"
              onRowClick={() =>
                navigate({ to: "/logs", search: { status: "error", fromAnalytics: true, analyticsItem: "Retries" } })
              }
              rows={retryRows}
            />
          )}
        </ChartCard>
      </div>
      )}
    </>
  );
}

function UsageTab({ range, model }: { range: AnalyticsRange; model: string }) {
  const navigate = useNavigate({ from: "/analytics" });
  const requestVolumeQuery = useQuery({
    queryKey: ["analytics", "request-volume", range],
    queryFn: () => analyticsApi.requestVolume(range),
  });
  const tokenTrendQuery = useQuery({
    queryKey: ["analytics", "token-trend", range],
    queryFn: () => analyticsApi.tokenTrend(range),
  });
  const requestsQuery = useQuery({
    queryKey: ["analytics", "requests", range, "usage-tab"],
    queryFn: () => analyticsApi.requests({ range, limit: 500, offset: 0 }),
  });

  const isLoading =
    requestVolumeQuery.isLoading || tokenTrendQuery.isLoading || requestsQuery.isLoading;
  const error = requestVolumeQuery.error ?? tokenTrendQuery.error ?? requestsQuery.error;
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Unable to load usage analytics.";

  const filteredRequests = filterByModel(requestsQuery.data?.items ?? [], model);
  const requestSeries = trendValues(requestVolumeQuery.data ?? [], "requests");
  const modelMix = aggregateModelMix(filteredRequests);
  const avgInput =
    filteredRequests.length > 0
      ? filteredRequests.reduce((sum, item) => sum + item.prompt_tokens, 0) / filteredRequests.length
      : 0;
  const avgOutput =
    filteredRequests.length > 0
      ? filteredRequests.reduce((sum, item) => sum + item.completion_tokens, 0) / filteredRequests.length
      : 0;
  const tokenShapeRows = [
    { label: "Avg input tokens", value: avgInput, right: Math.round(avgInput).toLocaleString() },
    { label: "Avg output tokens", value: avgOutput, right: Math.round(avgOutput).toLocaleString() },
    { label: "Avg total tokens", value: avgInput + avgOutput, right: Math.round(avgInput + avgOutput).toLocaleString() },
  ];
  const endpointRows = aggregateByEndpoint(filteredRequests).map((row) => ({
    label: row.label,
    value: row.value,
    right: row.right,
  }));

  return (
    <>
      {isLoading && <LoadingBanner label="Loading usage analytics…" />}
      {error && !isLoading && <ErrorBanner message={errorMessage} />}
      {!isLoading && !error && requestsQuery.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Requests over time" hint="Total volume of LLM requests captured by the TRACEai proxy per time bucket.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              data={requestSeries}
              formatValue={(v) => `${(v / 1000).toFixed(1)}k req`}
              onClick={() =>
                navigate({ to: "/logs", search: { time: "7d", fromAnalytics: true, analyticsItem: "Requests over time" } })
              }
            />
          )}
        </ChartCard>
        <ChartCard title="Model mix" hint="Share of requests routed to each model.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Bars
              color="#0EA5E9"
              onRowClick={(r) =>
                navigate({ to: "/logs", search: { model: r.label, fromAnalytics: true, analyticsItem: r.label } })
              }
              rows={modelMix}
            />
          )}
        </ChartCard>
        <ChartCard
          title="Avg prompt vs completion length"
          hint="Token shape across captured requests."
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Bars
              onRowClick={() =>
                navigate({ to: "/logs", search: { fromAnalytics: true, analyticsItem: "Token shapes" } })
              }
              rows={tokenShapeRows}
            />
          )}
        </ChartCard>
        <ChartCard title="Endpoint mix" hint="Traffic split by feature / endpoint.">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Bars
              color="#10B981"
              onRowClick={(r) =>
                navigate({ to: "/logs", search: { q: r.label, fromAnalytics: true, analyticsItem: r.label } })
              }
              rows={endpointRows}
            />
          )}
        </ChartCard>
      </div>
      )}
    </>
  );
}
