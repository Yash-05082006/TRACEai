import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { ErrorBanner, KpiSkeleton, LoadingBanner } from "@/components/app/DataState";
import { InfoTooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, ServerCrash, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, ApiError, type AnalyticsRange } from "@/lib/api";
import {
  aggregateByFeature,
  COST_DRIVER_COLORS,
  formatCurrency,
  formatNumber,
  formatPercent,
  providerHealthRows,
  providerLabel,
} from "@/lib/analytics-helpers";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "TRACEAI | Overview" },
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
  const apiRange = range as AnalyticsRange;

  const overviewQuery = useQuery({
    queryKey: ["analytics", "overview", apiRange],
    queryFn: () => analyticsApi.overview(apiRange),
  });
  const latencyQuery = useQuery({
    queryKey: ["analytics", "latency-trend", apiRange],
    queryFn: () => analyticsApi.latencyTrend(apiRange),
  });
  const providersQuery = useQuery({
    queryKey: ["analytics", "providers", apiRange],
    queryFn: () => analyticsApi.providers(apiRange),
  });
  const requestsQuery = useQuery({
    queryKey: ["analytics", "requests", apiRange, "dashboard"],
    queryFn: () => analyticsApi.requests({ range: apiRange, limit: 500, offset: 0 }),
  });

  const isLoading =
    overviewQuery.isLoading ||
    latencyQuery.isLoading ||
    providersQuery.isLoading ||
    requestsQuery.isLoading;
  const error =
    overviewQuery.error ?? latencyQuery.error ?? providersQuery.error ?? requestsQuery.error;
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Check that the backend is running and VITE_API_URL is configured.";

  const overview = overviewQuery.data;
  const p95Latency = useMemo(() => {
    const values = (latencyQuery.data ?? [])
      .map((point) => point.p95_latency_ms ?? 0)
      .filter((value) => value > 0);
    return values.length ? Math.max(...values) : overview?.avg_latency ?? 0;
  }, [latencyQuery.data, overview?.avg_latency]);

  const costDrivers = useMemo(
    () => aggregateByFeature(requestsQuery.data?.items ?? []),
    [requestsQuery.data?.items],
  );

  const healthRows = useMemo(
    () => providerHealthRows(providersQuery.data ?? [], requestsQuery.data?.items ?? []),
    [providersQuery.data, requestsQuery.data?.items],
  );

  const insights = useMemo(() => {
    if (!overview) return [];
    const topProvider = [...(providersQuery.data ?? [])].sort((a, b) => b.cost - a.cost)[0];
    const topFeature = costDrivers[0];
    const items: { icon: React.ReactNode; bg: string; title: string; desc: string }[] = [];

    if (topFeature) {
      items.push({
        icon: <TrendingUp className="h-4 w-4 text-amber-600" />,
        bg: "bg-amber-50",
        title: `Top cost driver: ${topFeature.label}`,
        desc: `${topFeature.label} accounts for ${topFeature.pct}% of spend (${topFeature.right}) in the last ${range}.`,
      });
    }

    items.push({
      icon: <Zap className="h-4 w-4 text-emerald-600" />,
      bg: "bg-emerald-50",
      title: `${formatNumber(overview.total_tokens)} tokens processed`,
      desc: `Across ${formatNumber(overview.total_requests)} requests with ${formatCurrency(overview.total_cost)} total spend in the last ${range}.`,
    });

    if (topProvider) {
      items.push({
        icon: <TrendingDown className="h-4 w-4 text-emerald-600" />,
        bg: "bg-emerald-50",
        title: `${providerLabel(topProvider.provider)} leads provider spend`,
        desc: `${providerLabel(topProvider.provider)} handled ${formatNumber(topProvider.requests)} requests at ${formatCurrency(topProvider.cost)} (${topProvider.pct?.toFixed(1) ?? "—"}% of cost).`,
      });
    }

    return items.slice(0, 3);
  }, [overview, providersQuery.data, costDrivers, range]);

  const alerts = useMemo(() => {
    const items = requestsQuery.data?.items ?? [];
    const errors = items.filter((item) => item.status >= 400);
    const byProvider = new Map<string, { count: number; statuses: Map<number, number> }>();

    for (const item of errors) {
      const key = providerLabel(item.provider);
      const current = byProvider.get(key) ?? { count: 0, statuses: new Map() };
      current.count += 1;
      current.statuses.set(item.status, (current.statuses.get(item.status) ?? 0) + 1);
      byProvider.set(key, current);
    }

    return Array.from(byProvider.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2)
      .map(([provider, data]) => {
        const topStatus = [...data.statuses.entries()].sort((a, b) => b[1] - a[1])[0];
        const statusCode = topStatus?.[0] ?? 500;
        const isRateLimit = statusCode === 429;
        return { provider, count: data.count, statusCode, isRateLimit };
      });
  }, [requestsQuery.data?.items]);

  const kpis = overview
    ? [
        {
          label: "Monthly Spend",
          value: formatCurrency(overview.total_cost),
          sub: `${formatNumber(overview.total_tokens)} tokens · last ${range}`,
          positive: true,
        },
        {
          label: "Requests Processed",
          value: formatNumber(overview.total_requests),
          sub: `Last ${range}`,
          positive: true,
        },
        {
          label: "Error Rate",
          value: formatPercent(overview.error_rate),
          sub: `Across ${formatNumber(overview.total_requests)} requests`,
          positive: overview.error_rate < 2,
        },
        {
          label: "P95 Latency",
          value: `${Math.round(p95Latency).toLocaleString()}ms`,
          sub: `Avg ${Math.round(overview.avg_latency).toLocaleString()}ms`,
          positive: p95Latency < 3000,
        },
      ]
    : [];

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
      {isLoading && <LoadingBanner />}
      {error && !isLoading && <ErrorBanner message={errorMessage} />}
      {!isLoading && !error && overview && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((kpi) => (
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Card className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">Key Insights</h2>
                  <InfoTooltip content="AI-generated insights highlighting significant changes in your LLM usage patterns, costs, and performance." />
                </div>
                {insights.length === 0 ? (
                  <p className="text-[12px] text-[#64748B]">No insights available for this time range.</p>
                ) : (
                  <ul className="space-y-4">
                    {insights.map((insight) => (
                      <InsightItem key={insight.title} {...insight} />
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">Reliability Alerts</h2>
                  <InfoTooltip content="Active errors, rate limits, or timeouts detected in your traffic that require immediate attention." />
                </div>
                {alerts.length === 0 ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[12px] text-emerald-800">
                    No reliability alerts in the last {range}.
                  </p>
                ) : (
                  alerts.map((alert) => (
                    <button
                      key={`${alert.provider}-${alert.statusCode}`}
                      onClick={() =>
                        navigate({
                          to: "/logs",
                          search: {
                            status: "error",
                            provider: alert.provider,
                            fromAnalytics: true,
                            analyticsItem: `${alert.provider} Errors`,
                          },
                        })
                      }
                      className={`text-left w-full rounded-xl border p-4 transition-colors cursor-pointer ${
                        alert.isRateLimit
                          ? "border-red-200 bg-red-50 hover:bg-red-100"
                          : "border-amber-200 bg-amber-50 hover:bg-amber-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {alert.isRateLimit ? (
                          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                        ) : (
                          <ServerCrash className="h-5 w-5 shrink-0 text-amber-600" />
                        )}
                        <div>
                          <h3
                            className={`text-[13px] font-semibold ${
                              alert.isRateLimit ? "text-red-900" : "text-amber-900"
                            }`}
                          >
                            {alert.count} {alert.statusCode} errors on {alert.provider}
                          </h3>
                          <p
                            className={`mt-1 text-[12px] ${
                              alert.isRateLimit ? "text-red-800" : "text-amber-800"
                            }`}
                          >
                            Detected in the last {range} from live telemetry.
                          </p>
                          <p
                            className={`mt-2 text-[11px] font-medium underline ${
                              alert.isRateLimit ? "text-red-700" : "text-amber-700"
                            }`}
                          >
                            View affected requests →
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </Card>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-1">
              <Card className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">Cost Drivers</h2>
                  <InfoTooltip content="Breakdown of your spend by endpoint or model. Identifies where your budget is actually going." />
                </div>
                {costDrivers.length === 0 ? (
                  <p className="text-[12px] text-[#64748B]">No cost data for this time range.</p>
                ) : (
                  <div className="space-y-4">
                    {costDrivers.map((driver, index) => (
                      <CostDriver
                        key={driver.label}
                        name={driver.label}
                        amount={formatCurrency(driver.value)}
                        pct={driver.pct}
                        color={COST_DRIVER_COLORS[index % COST_DRIVER_COLORS.length]}
                        onClick={() =>
                          navigate({
                            to: "/logs",
                            search: { q: driver.label, fromAnalytics: true, analyticsItem: driver.label },
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </Card>

              <Card className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">Provider Health</h2>
                  <InfoTooltip content="Real-time status and latency percentiles for the upstream LLM providers you are connected to." />
                </div>
                {healthRows.length === 0 ? (
                  <p className="text-[12px] text-[#64748B]">No provider data for this time range.</p>
                ) : (
                  <div className="divide-y divide-[#0F172A]/8 border-t border-[#0F172A]/8">
                    {healthRows.map((row) => (
                      <HealthRow
                        key={row.provider}
                        provider={row.provider}
                        status={row.status}
                        lat={row.lat}
                        isWarning={row.isWarning}
                        onClick={() =>
                          navigate({
                            to: "/logs",
                            search: {
                              provider: row.provider,
                              status: row.isWarning ? "error" : undefined,
                              fromAnalytics: true,
                              analyticsItem: `${row.provider} Health`,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
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
      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${bg}`}>{icon}</div>
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
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
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
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 text-[12px] hover:bg-[#0F172A]/[0.03] -mx-1 px-1 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2 font-medium text-[#0F172A]">
        <div
          className={`h-2 w-2 rounded-full ${isWarning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
        />
        {provider}
      </div>
      <div className="flex items-center gap-3">
        <span className={isWarning ? "text-amber-600 font-medium" : "text-[#64748B]"}>{status}</span>
        <span className="font-mono text-[#94A3B8]">p99: {lat}</span>
      </div>
    </button>
  );
}
