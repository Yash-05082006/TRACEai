import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ErrorBanner, LoadingBanner } from "@/components/app/DataState";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Copy,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  ChevronLeft,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, ApiError } from "@/lib/api";
import {
  mapApiRequestToExplorer,
  PROVIDER_COLORS,
  providerToApi,
  timeFilterToRange,
  type ExplorerRequest,
} from "@/lib/analytics-helpers";

type LogsSearch = {
  q?: string;
  status?: "all" | "success" | "error";
  provider?: string;
  model?: string;
  time?: "1h" | "6h" | "24h" | "7d" | "30d";
  fromAnalytics?: boolean;
  analyticsItem?: string;
};

export const Route = createFileRoute("/logs")({
  validateSearch: (search: Record<string, unknown>): LogsSearch => {
    return {
      q: typeof search.q === "string" ? search.q : undefined,
      status: (search.status === "all" || search.status === "success" || search.status === "error") ? search.status : undefined,
      provider: typeof search.provider === "string" ? search.provider : undefined,
      model: typeof search.model === "string" ? search.model : undefined,
      time: (["1h", "6h", "24h", "7d", "30d"].includes(search.time as string)) ? (search.time as any) : undefined,
      fromAnalytics: typeof search.fromAnalytics === "boolean" ? search.fromAnalytics : undefined,
      analyticsItem: typeof search.analyticsItem === "string" ? search.analyticsItem : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "TRACEAI | Request Explorer" },
      {
        name: "description",
        content:
          "Inspect every LLM request: prompt, completion, tokens, latency, cost, and status.",
      },
    ],
  }),
  component: RequestExplorerPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Req = ExplorerRequest;

const PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusMeta(s: number): {
  label: string;
  bg: string;
  text: string;
  ring: string;
  icon: typeof CheckCircle2;
} {
  if (s >= 200 && s < 300)
    return {
      label: `${s}`,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-200",
      icon: CheckCircle2,
    };
  if (s === 429)
    return {
      label: `${s} Rate Limited`,
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-200",
      icon: Clock,
    };
  return {
    label: `${s} Error`,
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    icon: AlertTriangle,
  };
}

function fmt(n: number, unit: string) {
  return `${n.toLocaleString()} ${unit}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function RequestExplorerPage() {
  const navigate = useNavigate({ from: "/logs" });
  const search = Route.useSearch();

  const q = search.q || "";
  const statusFilter = search.status || "all";
  const providerFilter = search.provider || "all";
  const modelFilter = search.model || "all";
  const timeFilter = search.time || "24h";
  const { fromAnalytics, analyticsItem } = search;

  const [selected, setSelected] = useState<Req | null>(null);
  const [offset, setOffset] = useState(0);
  const apiRange = timeFilterToRange(timeFilter);

  useEffect(() => {
    setOffset(0);
  }, [q, statusFilter, providerFilter, modelFilter, timeFilter]);

  const requestsQuery = useQuery({
    queryKey: ["analytics", "requests", apiRange, statusFilter, providerFilter, q, offset],
    queryFn: () =>
      analyticsApi.requests({
        range: apiRange,
        limit: PAGE_SIZE,
        offset,
        status: statusFilter === "all" ? undefined : statusFilter,
        provider: providerToApi(providerFilter),
        q: q || undefined,
      }),
  });

  const isLoading = requestsQuery.isLoading;
  const error = requestsQuery.error;
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Check that the backend is running and VITE_API_URL is configured.";

  const mappedRows = useMemo(
    () => (requestsQuery.data?.items ?? []).map(mapApiRequestToExplorer),
    [requestsQuery.data?.items],
  );

  const rows = useMemo(
    () =>
      modelFilter === "all" ? mappedRows : mappedRows.filter((row) => row.model === modelFilter),
    [mappedRows, modelFilter],
  );

  const providers = useMemo(
    () => Array.from(new Set(mappedRows.map((row) => row.provider))).sort(),
    [mappedRows],
  );
  const models = useMemo(
    () =>
      Array.from(
        new Set(
          mappedRows
            .filter((row) => providerFilter === "all" || row.provider === providerFilter)
            .map((row) => row.model),
        ),
      ).sort(),
    [mappedRows, providerFilter],
  );

  const total = requestsQuery.data?.total ?? 0;
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  const updateSearch = (newSearch: Partial<LogsSearch>) => {
    navigate({
      search: (prev) => ({ ...prev, ...newSearch }),
      replace: true,
    });
  };

  const setQ = (v: string) => updateSearch({ q: v || undefined });
  const setStatusFilter = (v: LogsSearch["status"] | "all") =>
    updateSearch({ status: v === "all" ? undefined : v });
  const setProviderFilter = (v: string) =>
    updateSearch({ provider: v === "all" ? undefined : v, model: undefined });
  const setModelFilter = (v: string) => updateSearch({ model: v === "all" ? undefined : v });
  const setTimeFilter = (v: LogsSearch["time"] | "24h") =>
    updateSearch({ time: v === "24h" ? undefined : v });

  const hasActiveFilters =
    q || statusFilter !== "all" || providerFilter !== "all" || modelFilter !== "all" || timeFilter !== "24h";

  return (
    <AppShell
      title="Request Explorer"
      subtitle="Every captured LLM request - searchable, filterable, drill-down to prompt and completion."
      actions={
        <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
          {isLoading ? (
            <Skeleton className="h-4 w-28" />
          ) : (
            <>
              <span className="font-semibold text-[#0F172A]">{rows.length}</span> of {total.toLocaleString()}{" "}
              requests
            </>
          )}
        </div>
      }
    >
      {isLoading && <LoadingBanner label="Loading requests…" />}
      {error && !isLoading && <ErrorBanner message={errorMessage} />}
      {/* Toolbar */}
      <div className="mb-4 rounded-xl border border-[#0F172A]/8 bg-white/80 p-3 backdrop-blur-sm">
        {fromAnalytics && (
          <div className="mb-4 flex items-center gap-2 border-b border-[#0F172A]/8 pb-3 text-[13px] text-[#64748B]">
            <button onClick={() => navigate({ to: '/analytics' })} className="font-medium hover:text-[#0F172A] hover:underline">
              Analytics
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-[#0F172A]">{analyticsItem || "Drilldown"}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-[#0F172A]">Request Explorer</span>
            
            <button 
              onClick={() => navigate({ search: {}, replace: true })}
              className="ml-auto flex items-center gap-1.5 rounded-md bg-[#0F172A]/5 px-2 py-1 text-xs font-semibold text-[#0F172A] hover:bg-[#0F172A]/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, model, feature, user, or prompt content…"
              className="w-full rounded-lg border border-[#0F172A]/10 bg-white py-2 pl-9 pr-3 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>

          {/* Provider */}
          <FilterSelect
            value={providerFilter}
            onChange={(v) => {
              setProviderFilter(v);
              setModelFilter("all");
            }}
            options={[
              { label: "All Providers", value: "all" },
              ...providers.map((p) => ({ label: p, value: p })),
            ]}
          />

          {/* Model */}
          <FilterSelect
            value={modelFilter}
            onChange={setModelFilter}
            options={[
              { label: "All Models", value: "all" },
              ...models.map((m) => ({ label: m, value: m })),
            ]}
          />

          {/* Time range */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-[#0F172A]/8 bg-white px-1 py-0.5">
            <Filter className="ml-1 h-3 w-3 text-[#94A3B8]" />
            {(["1h", "6h", "24h", "7d", "30d"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  timeFilter === t
                    ? "bg-[#0F172A] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="inline-flex rounded-lg border border-[#0F172A]/8 bg-white p-0.5">
            {(["all", "success", "error"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-[#0F172A] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setQ("");
                setStatusFilter("all");
                setProviderFilter("all");
                setModelFilter("all");
                setTimeFilter("24h");
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#94A3B8] hover:bg-[#0F172A]/[0.04] hover:text-[#475569]"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#0F172A]/8 bg-white/80 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#0F172A]/8 bg-[#F8FAFC]">
                {[
                  { label: "Timestamp", align: "left", tooltip: "When the request was received by the TRACEai proxy (UTC)." },
                  { label: "Application", align: "left", tooltip: "The originating application." },
                  { label: "Endpoint", align: "left", tooltip: "The API endpoint hit." },
                  { label: "Feature", align: "left", tooltip: "The product feature attached." },
                  { label: "Provider", align: "left", tooltip: "The upstream LLM provider." },
                  { label: "Model", align: "left", tooltip: "The specific model variant called." },
                  { label: "Tokens", align: "right", tooltip: "Total tokens = Input tokens + Output tokens. Input tokens are your prompt; output tokens are the model's response. Drives cost." },
                  { label: "Cost", align: "right", tooltip: "Estimated cost calculated as (input_tokens × input_price + output_tokens × output_price) for the selected model." },
                  { label: "Latency", align: "right", tooltip: "Total round-trip time from proxy receiving the request to returning the full response. Includes network overhead and model generation time." },
                  { label: "Status", align: "left", tooltip: "HTTP response code. 2xx = success, 429 = rate limited (too many requests), 5xx = server error." },
                  { label: "", align: "right" },
                ].map((h) => (
                  <th
                    key={h.label}
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] ${
                      h.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <span className={`inline-flex items-center gap-1 ${
                      h.align === "right" ? "flex-row-reverse" : ""
                    }`}>
                      {h.label}
                      {h.tooltip && <InfoTooltip content={h.tooltip} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-t border-[#0F172A]/[0.05]">
                    {Array.from({ length: 11 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState onClear={() => navigate({ search: {}, replace: true })} />
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const sm = statusMeta(r.status);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className={`cursor-pointer border-t border-[#0F172A]/[0.05] transition-colors hover:bg-[#2563EB]/[0.03] ${
                        selected?.id === r.id ? "bg-[#2563EB]/[0.05]" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-[11px] text-[#64748B]">{r.ts}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#0F172A]">
                        {r.application}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#475569]">
                        {r.endpoint}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-medium text-[#2563EB]">
                        {r.feature}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${PROVIDER_COLORS[r.provider] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {r.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#475569]">{r.model}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[12px] text-[#475569]">
                        {(r.inTok + r.outTok).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[12px] font-medium text-[#0F172A]">
                        ${r.cost.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[12px] text-[#475569]">
                        {r.latencyMs.toLocaleString()} ms
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${sm.bg} ${sm.text} ${sm.ring}`}
                        >
                          <sm.icon className="h-3 w-3" />
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#C7D2DA]" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-[#0F172A]/8 bg-[#F8FAFC] px-4 py-3 text-[12px] text-[#64748B]">
            <span>
              Showing {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!canPrev}
                onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#0F172A]/10 bg-white px-3 py-1.5 font-medium text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <button
                disabled={!canNext}
                onClick={() => setOffset((current) => current + PAGE_SIZE)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#0F172A]/10 bg-white px-3 py-1.5 font-medium text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selected && <DetailDrawer req={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </AppShell>
  );
}

// ─── Filter Select ─────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[12px] font-medium text-[#475569] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#0F172A]/8 bg-white shadow-sm">
        <Search className="h-7 w-7 text-[#94A3B8]" />
      </div>
      <p className="mt-5 text-[15px] font-semibold tracking-tight text-[#0F172A]">No requests found</p>
      <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#64748B]">
        We couldn't find any requests matching your current filters. Try adjusting your search criteria.
      </p>
      <button 
        onClick={onClear}
        className="mt-6 rounded-lg bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0F172A]/90 transition-colors shadow-sm"
      >
        Clear All Filters
      </button>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({ req, onClose }: { req: Req; onClose: () => void }) {
  const totalTok = req.inTok + req.outTok;
  const inCost = totalTok > 0 ? (req.cost * req.inTok) / totalTok : 0;
  const outCost = req.cost - inCost;
  const sm = statusMeta(req.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex justify-end bg-[#0F172A]/25 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="relative flex h-full w-full max-w-[680px] flex-col overflow-hidden bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#0F172A]/8 bg-white px-6 py-4">
          <div>
            <div className="font-mono text-[11px] text-[#94A3B8]">{req.id}</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${sm.bg} ${sm.text} ${sm.ring}`}
              >
                <sm.icon className="h-3 w-3" />
                {sm.label}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${PROVIDER_COLORS[req.provider] ?? ""}`}
              >
                {req.provider}
              </span>
              <span className="font-mono text-[11px] text-[#64748B]">{req.model}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#475569] hover:bg-[#0F172A]/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0 divide-y divide-[#0F172A]/[0.06]">
            {/* Overview */}
            <DrawerSection title="Overview">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
                {[
                  ["Request ID", <span className="font-mono">{req.id}</span>],
                  ["Timestamp", req.ts],
                  ["Application", req.application],
                  ["Endpoint", <span className="font-mono">{req.endpoint}</span>],
                  ["Feature", req.feature],
                  ["Provider", req.provider],
                  ["Model", <span className="font-mono">{req.model}</span>],
                  ["Status", sm.label],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                      {k}
                    </dt>
                    <dd className="mt-0.5 font-medium text-[#0F172A]">{v}</dd>
                  </div>
                ))}
              </dl>
            </DrawerSection>

            {/* Prompt */}
            <DrawerSection title="Prompt" copyText={req.prompt}>
              <pre className="whitespace-pre-wrap break-words rounded-lg border border-[#0F172A]/8 bg-[#0F172A]/[0.02] p-4 font-mono text-[12px] leading-relaxed text-[#0F172A]">
                {req.prompt}
              </pre>
            </DrawerSection>

            {/* Completion */}
            <DrawerSection title="Completion" copyText={req.completion}>
              {req.completion ? (
                <pre className="whitespace-pre-wrap break-words rounded-lg border border-[#0F172A]/8 bg-[#0F172A]/[0.02] p-4 font-mono text-[12px] leading-relaxed text-[#0F172A]">
                  {req.completion}
                </pre>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-red-200 bg-red-50/50 px-4 py-3 text-[12px] text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  No completion - request failed with status {req.status}
                </div>
              )}
            </DrawerSection>

            {/* Usage */}
            <DrawerSection title="Usage">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Input Tokens", value: fmt(req.inTok, "tok") },
                  { label: "Output Tokens", value: fmt(req.outTok, "tok") },
                  { label: "Total Tokens", value: fmt(totalTok, "tok") },
                  { label: "Total Cost", value: `$${req.cost.toFixed(5)}` },
                  { label: "Input Cost", value: `$${inCost.toFixed(5)}` },
                  { label: "Output Cost", value: `$${outCost.toFixed(5)}` },
                ].map((m) => (
                  <MetricCard key={m.label} label={m.label} value={m.value} />
                ))}
              </div>
            </DrawerSection>

            {/* Performance */}
            <DrawerSection title="Performance">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Latency", value: `${req.latencyMs} ms` },
                  {
                    label: "Time to First Token",
                    value: req.ttftMs > 0 ? `${req.ttftMs} ms` : "N/A",
                  },
                  {
                    label: "Completion Time",
                    value: req.completionMs > 0 ? `${req.completionMs} ms` : "N/A",
                  },
                ].map((m) => (
                  <MetricCard key={m.label} label={m.label} value={m.value} />
                ))}
              </div>
            </DrawerSection>

            {/* Metadata */}
            <DrawerSection title="Metadata">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
                {[
                  ["User ID", <span className="font-mono">{req.userId}</span>],
                  ["Session ID", <span className="font-mono">{req.sessionId}</span>],
                  ["Feature", req.feature],
                  [
                    "Tags",
                    <div className="flex flex-wrap gap-1">
                      {req.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-[#0F172A]/[0.05] px-2 py-0.5 font-mono text-[11px] text-[#475569]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>,
                  ],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                      {k}
                    </dt>
                    <dd className="mt-0.5 font-medium text-[#0F172A]">{v}</dd>
                  </div>
                ))}
              </dl>
            </DrawerSection>

            {/* Trace */}
            <DrawerSection title="Trace Timeline">
              <ol className="relative space-y-0 pl-4">
                {req.trace.map((t, i) => {
                  const isLast = i === req.trace.length - 1;
                  const isError =
                    t.label.toLowerCase().includes("error") ||
                    t.label.toLowerCase().includes("limit") ||
                    t.label.toLowerCase().includes("timeout");
                  return (
                    <li key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                      {/* Line */}
                      {!isLast && (
                        <div className="absolute left-0 top-4 bottom-0 w-px -translate-x-0.5 bg-[#0F172A]/[0.08]" />
                      )}
                      {/* Dot */}
                      <div
                        className={`relative z-10 mt-0.5 h-2 w-2 shrink-0 -translate-x-0.5 rounded-full ring-2 ring-white ${
                          isError ? "bg-red-400" : isLast ? "bg-emerald-500" : "bg-[#2563EB]"
                        }`}
                      />
                      <div className="flex flex-1 items-baseline justify-between gap-4">
                        <span
                          className={`text-[12px] font-medium ${isError ? "text-red-600" : "text-[#0F172A]"}`}
                        >
                          {t.label}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-[#94A3B8]">
                          +{t.offsetMs} ms
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </DrawerSection>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DrawerSection({
  title,
  copyText,
  children,
}: {
  title: string;
  copyText?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard?.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="px-6 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8]">
          {title}
        </h3>
        {copyText && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-[#64748B] transition-colors hover:bg-[#0F172A]/[0.04] hover:text-[#2563EB]"
          >
            <Copy className="h-3 w-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">{label}</div>
      <div className="mt-1 font-mono text-[15px] font-semibold text-[#0F172A]">{value}</div>
    </div>
  );
}
