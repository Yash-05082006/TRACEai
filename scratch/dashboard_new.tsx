import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { ErrorBanner, LoadingBanner } from "@/components/app/DataState";
import { InfoTooltip } from "@/components/ui/tooltip";
import { TrendingUp, AlertTriangle, ServerCrash, Zap, Layers, AppWindow, Cpu } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, ApiError, type AnalyticsRange } from "@/lib/api";
import { COST_DRIVER_COLORS, formatCurrency, formatNumber, formatPercent } from "@/lib/analytics-helpers";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "TRACEAI | Dashboard" },
      { name: "description", content: "Endpoint-centric LLM observability dashboard." },
    ],
  }),
  component: DashboardPage,
});

const ranges = ["1h", "24h", "7d", "30d"] as const;
type Range = (typeof ranges)[number];

function DashboardPage() {
  const [range, setRange] = useState<Range>("24h");
  const navigate = useNavigate();
  const apiRange = range as AnalyticsRange;

  const overviewQuery = useQuery({ queryKey: ["analytics", "overview", apiRange], queryFn: () => analyticsApi.overview(apiRange) });
  const endpointsQuery = useQuery({ queryKey: ["analytics", "endpoints", apiRange], queryFn: () => analyticsApi.endpoints(apiRange) });
  const featuresQuery = useQuery({ queryKey: ["analytics", "features", apiRange], queryFn: () => analyticsApi.features(apiRange) });
  const applicationsQuery = useQuery({ queryKey: ["analytics", "applications", apiRange], queryFn: () => analyticsApi.applications(apiRange) });

  const isLoading = overviewQuery.isLoading || endpointsQuery.isLoading || featuresQuery.isLoading || applicationsQuery.isLoading;
  const error = overviewQuery.error ?? endpointsQuery.error ?? featuresQuery.error ?? applicationsQuery.error;
  const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Failed to load dashboard.";

  const overview = overviewQuery.data;

  const topApps = useMemo(() => {
    return (applicationsQuery.data ?? []).sort((a, b) => b.cost - a.cost).slice(0, 5);
  }, [applicationsQuery.data]);

  const mostExpensiveEndpoints = useMemo(() => {
    return (endpointsQuery.data ?? []).sort((a, b) => b.cost - a.cost).slice(0, 5);
  }, [endpointsQuery.data]);

  const highestLatencyEndpoints = useMemo(() => {
    return (endpointsQuery.data ?? []).sort((a, b) => b.avg_latency_ms - a.avg_latency_ms).slice(0, 5);
  }, [endpointsQuery.data]);

  const highestErrorRateEndpoints = useMemo(() => {
    return (endpointsQuery.data ?? []).filter(e => e.error_rate > 0).sort((a, b) => b.error_rate - a.error_rate).slice(0, 5);
  }, [endpointsQuery.data]);

  const topFeatures = useMemo(() => {
    return (featuresQuery.data ?? []).sort((a, b) => b.tokens - a.tokens).slice(0, 5);
  }, [featuresQuery.data]);

  const kpis = overview ? [
    { label: "Total Cost", value: formatCurrency(overview.total_cost), icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
    { label: "Total Tokens", value: formatNumber(overview.total_tokens), icon: <Cpu className="h-4 w-4 text-blue-500" /> },
    { label: "Requests Processed", value: formatNumber(overview.total_requests), icon: <Zap className="h-4 w-4 text-amber-500" /> },
    { label: "Overall Error Rate", value: formatPercent(overview.error_rate), icon: <ServerCrash className="h-4 w-4 text-red-500" /> },
  ] : [];

  return (
    <AppShell
      title="Endpoint Observability"
      subtitle="Analyze cost, latency, and reliability aggregated natively by Application, Endpoint, and Feature."
      actions={
        <div className="inline-flex rounded-lg border border-[#0F172A]/8 bg-white p-0.5 shadow-sm">
          {ranges.map((r) => (
            <button key={r} onClick={() => setRange(r)} className={\`rounded-md px-3 py-1 text-[12px] font-medium transition-colors \${range === r ? "bg-[#0F172A] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"}\`}>{r}</button>
          ))}
        </div>
      }
    >
      {isLoading && <LoadingBanner />}
      {error && !isLoading && <ErrorBanner message={errorMessage} />}
      
      {!isLoading && !error && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="flex flex-col p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">{kpi.label}</div>
                  {kpi.icon}
                </div>
                <div className="text-[28px] font-bold tracking-tight text-[#0F172A]">{kpi.value}</div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Applications */}
            <Card className="flex flex-col p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><AppWindow className="h-4 w-4" /></div>
                <h2 className="text-[16px] font-semibold tracking-tight text-[#0F172A]">Top Applications by Cost</h2>
              </div>
              {topApps.length === 0 ? <EmptyData /> : (
                <div className="space-y-4">
                  {topApps.map((app, i) => (
                    <BarChartRow key={app.application_name} label={app.application_name} value={app.cost} max={topApps[0].cost} format={(v) => formatCurrency(v)} sub={\`\${formatNumber(app.requests)} req\`} color={COST_DRIVER_COLORS[i % COST_DRIVER_COLORS.length]} />
                  ))}
                </div>
              )}
            </Card>

            {/* Most Expensive Endpoints */}
            <Card className="flex flex-col p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><TrendingUp className="h-4 w-4" /></div>
                <h2 className="text-[16px] font-semibold tracking-tight text-[#0F172A]">Most Expensive Endpoints</h2>
              </div>
              {mostExpensiveEndpoints.length === 0 ? <EmptyData /> : (
                <div className="space-y-4">
                  {mostExpensiveEndpoints.map((ep, i) => (
                    <BarChartRow key={ep.endpoint} label={ep.endpoint} value={ep.cost} max={mostExpensiveEndpoints[0].cost} format={(v) => formatCurrency(v)} sub={\`\${ep.pct?.toFixed(1) || 0}% of total\`} color={COST_DRIVER_COLORS[i % COST_DRIVER_COLORS.length]} />
                  ))}
                </div>
              )}
            </Card>

            {/* Top Features */}
            <Card className="flex flex-col p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Layers className="h-4 w-4" /></div>
                <h2 className="text-[16px] font-semibold tracking-tight text-[#0F172A]">Top Features by Tokens</h2>
              </div>
              {topFeatures.length === 0 ? <EmptyData /> : (
                <div className="space-y-4">
                  {topFeatures.map((f, i) => (
                    <BarChartRow key={f.feature} label={f.feature} value={f.tokens} max={topFeatures[0].tokens} format={(v) => formatNumber(v) + " tok"} sub={\`\${formatCurrency(f.cost)}\`} color={COST_DRIVER_COLORS[i % COST_DRIVER_COLORS.length]} />
                  ))}
                </div>
              )}
            </Card>

            {/* Highest Latency Endpoints */}
            <Card className="flex flex-col p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Zap className="h-4 w-4" /></div>
                <h2 className="text-[16px] font-semibold tracking-tight text-[#0F172A]">Highest Latency Endpoints</h2>
              </div>
              {highestLatencyEndpoints.length === 0 ? <EmptyData /> : (
                <div className="space-y-4">
                  {highestLatencyEndpoints.map((ep, i) => (
                    <BarChartRow key={ep.endpoint} label={ep.endpoint} value={ep.avg_latency_ms} max={highestLatencyEndpoints[0].avg_latency_ms} format={(v) => Math.round(v) + "ms"} sub={\`\${formatNumber(ep.requests)} req\`} color={COST_DRIVER_COLORS[i % COST_DRIVER_COLORS.length]} />
                  ))}
                </div>
              )}
            </Card>

            {/* Highest Error Rate Endpoints */}
            <Card className="flex flex-col p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600"><AlertTriangle className="h-4 w-4" /></div>
                <h2 className="text-[16px] font-semibold tracking-tight text-[#0F172A]">Highest Error Rate Endpoints</h2>
              </div>
              {highestErrorRateEndpoints.length === 0 ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-[13px] font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" /> 0% Error Rates detected across all endpoints! 
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {highestErrorRateEndpoints.map(ep => (
                    <div key={ep.endpoint} onClick={() => navigate({ to: '/logs', search: { status: 'error', fromAnalytics: true, analyticsItem: ep.endpoint } })} className="p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors">
                      <div className="text-[14px] font-semibold text-red-900 mb-1">{ep.endpoint}</div>
                      <div className="flex justify-between items-end">
                        <span className="text-[20px] font-bold tracking-tight text-red-700">{ep.error_rate.toFixed(1)}%</span>
                        <span className="text-[11px] font-medium text-red-800 underline">View Errors &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>
        </div>
      )}
    </AppShell>
  );
}

function BarChartRow({ label, value, max, format, sub, color }: { label: string; value: number; max: number; format: (v: number) => string; sub: string; color: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-1.5">
        <div className="text-[13px] font-semibold text-[#0F172A] truncate pr-4">{label}</div>
        <div className="text-[13px] font-medium text-[#0F172A] shrink-0">{format(value)} <span className="text-[12px] font-normal text-[#64748B] ml-1">({sub})</span></div>
      </div>
      <div className="h-2 w-full rounded-full bg-[#0F172A]/[0.03] overflow-hidden">
        <div className={\`h-full rounded-full bg-gradient-to-r \${color}\`} style={{ width: \`\${pct}%\` }} />
      </div>
    </div>
  );
}

function EmptyData() {
  return <div className="text-[13px] text-[#94A3B8] p-4 text-center border border-dashed border-[#0F172A]/10 rounded-xl">No data available for this range.</div>;
}
