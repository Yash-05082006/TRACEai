import type { ProviderStats, RequestLogItem, TrendPoint, AnalyticsRange } from "@/lib/api";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google Gemini",
  deepseek: "DeepSeek",
  openrouter: "OpenRouter",
  gemini: "Google Gemini",
};

const PROVIDER_TO_API: Record<string, string> = {
  OpenAI: "openai",
  Anthropic: "anthropic",
  Google: "google",
  "Google Gemini": "google",
  DeepSeek: "deepseek",
  OpenRouter: "openrouter",
};

export function providerLabel(provider: string) {
  return PROVIDER_LABELS[provider.toLowerCase()] ?? provider;
}

export function providerToApi(provider: string) {
  if (provider === "all") return undefined;
  return PROVIDER_TO_API[provider] ?? provider.toLowerCase();
}

export function formatCurrency(value: number, digits = 2) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
  if (value >= 1) return `$${value.toFixed(digits)}`;
  return `$${value.toFixed(4)}`;
}

export function formatNumber(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return value.toLocaleString();
  return value.toString();
}

export function formatPercent(value: number, digits = 2) {
  return `${value.toFixed(digits)}%`;
}

export function toCumulative(values: number[]) {
  let running = 0;
  return values.map((value) => {
    running += value;
    return running;
  });
}

export function trendValues(points: TrendPoint[], key: keyof TrendPoint) {
  return points.map((point) => Number(point[key] ?? 0));
}

export function aggregateByFeature(requests: RequestLogItem[]) {
  const map = new Map<string, { cost: number; count: number }>();
  for (const request of requests) {
    const key = request.feature || "unknown";
    const current = map.get(key) ?? { cost: 0, count: 0 };
    current.cost += request.cost;
    current.count += 1;
    map.set(key, current);
  }
  const totalCost = Array.from(map.values()).reduce((sum, item) => sum + item.cost, 0) || 1;
  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      value: value.cost,
      right: `${formatCurrency(value.cost)} · ${value.count.toLocaleString()} req`,
      pct: Math.round((value.cost / totalCost) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function aggregateByModel(requests: RequestLogItem[]) {
  const map = new Map<string, number>();
  for (const request of requests) {
    map.set(request.model, (map.get(request.model) ?? 0) + request.cost);
  }
  const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0) || 1;
  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      value,
      right: formatCurrency(value),
      pct: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function aggregateByEndpoint(requests: RequestLogItem[]) {
  const map = new Map<string, number>();
  for (const request of requests) {
    const key = request.endpoint || "unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0) || 1;
  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      value,
      right: `${Math.round((value / total) * 100)}%`,
      pct: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function aggregateStatusBreakdown(requests: RequestLogItem[]) {
  const map = new Map<number, number>();
  for (const request of requests) {
    map.set(request.status, (map.get(request.status) ?? 0) + 1);
  }
  const total = requests.length || 1;
  const labels: Record<number, string> = {
    200: "200 OK",
    429: "429 Rate-limited",
    500: "500 Server error",
    504: "504 Timeout",
  };
  return Array.from(map.entries())
    .map(([status, count]) => ({
      label: labels[status] ?? `${status}`,
      value: count,
      right: `${((count / total) * 100).toFixed(1)}%`,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

export function averageLatencyByProvider(requests: RequestLogItem[]) {
  const map = new Map<string, { total: number; count: number }>();
  for (const request of requests) {
    const key = request.provider.toLowerCase();
    const current = map.get(key) ?? { total: 0, count: 0 };
    current.total += request.latency_ms;
    current.count += 1;
    map.set(key, current);
  }
  return map;
}

export function providerHealthRows(providers: ProviderStats[], requests: RequestLogItem[]) {
  const latencyMap = averageLatencyByProvider(requests);
  const errorCounts = new Map<string, number>();
  for (const request of requests) {
    if (request.status >= 400) {
      const key = request.provider.toLowerCase();
      errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
    }
  }

  return providers.map((provider) => {
    const key = provider.provider.toLowerCase();
    const avgLatency = latencyMap.get(key);
    const errors = errorCounts.get(key) ?? 0;
    const errorRate = provider.requests > 0 ? (errors / provider.requests) * 100 : 0;
    return {
      provider: providerLabel(provider.provider),
      apiProvider: key,
      status: errorRate > 3 ? "Degraded" : "Healthy",
      lat: avgLatency ? `${Math.round(avgLatency.total / avgLatency.count).toLocaleString()}ms` : "—",
      isWarning: errorRate > 3,
    };
  });
}

export const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "bg-[#10A37F]/10 text-[#10A37F]",
  Anthropic: "bg-[#D97757]/10 text-[#D97757]",
  Google: "bg-[#4285F4]/10 text-[#4285F4]",
  "Google Gemini": "bg-[#4285F4]/10 text-[#4285F4]",
  DeepSeek: "bg-[#4D6BFE]/10 text-[#4D6BFE]",
  OpenRouter: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
};

export const COST_DRIVER_COLORS = [
  "from-indigo-500 to-indigo-600",
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-violet-500 to-violet-600",
];

export type ExplorerRequest = {
  id: string;
  ts: string;
  provider: string;
  model: string;
  inTok: number;
  outTok: number;
  cost: number;
  latencyMs: number;
  ttftMs: number;
  completionMs: number;
  status: number;
  prompt: string;
  completion: string;
  application: string;
  endpoint: string;
  feature: string;
  userId: string;
  sessionId: string;
  tags: string[];
  trace: { label: string; offsetMs: number }[];
};

export function mapApiRequestToExplorer(item: RequestLogItem): ExplorerRequest {
  const ttftMs = Math.max(1, Math.round(item.latency_ms * 0.25));
  const completionMs = Math.max(0, item.latency_ms - ttftMs);
  const status = item.status;
  const trace =
    status >= 400
      ? [
          { label: "Request received", offsetMs: 0 },
          { label: "Auth validated", offsetMs: 4 },
          { label: "Sent to provider", offsetMs: 8 },
          { label: `Provider error (${status})`, offsetMs: item.latency_ms },
        ]
      : [
          { label: "Request received", offsetMs: 0 },
          { label: "Auth validated", offsetMs: 3 },
          { label: "Sent to provider", offsetMs: 7 },
          { label: "First token received", offsetMs: ttftMs },
          { label: "Response completed", offsetMs: item.latency_ms },
        ];

  return {
    id: item.id,
    ts: new Date(item.created_at).toLocaleString(),
    provider: providerLabel(item.provider),
    model: item.model,
    inTok: item.prompt_tokens,
    outTok: item.completion_tokens,
    cost: item.cost,
    latencyMs: item.latency_ms,
    ttftMs,
    completionMs,
    status,
    prompt: item.prompt_preview ?? "",
    completion: item.completion_preview ?? "",
    application: item.application_name ?? "Unknown App",
    endpoint: item.endpoint ?? "unknown",
    feature: item.feature ?? "unknown",
    userId: "—",
    sessionId: "—",
    tags: item.feature ? [item.feature] : [],
    trace,
  };
}

export function timeFilterToRange(time: string): AnalyticsRange {
  if (time === "1h") return "1h";
  if (time === "7d") return "7d";
  if (time === "30d") return "30d";
  return "24h";
}
