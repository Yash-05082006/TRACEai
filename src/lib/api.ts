const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type AnalyticsRange = "1h" | "24h" | "7d" | "30d" | "90d";

export type OverviewMetrics = {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_latency: number;
  error_rate: number;
  range: string;
};

export type TrendPoint = {
  timestamp: string;
  cost?: number;
  tokens?: number;
  requests?: number;
  avg_latency_ms?: number;
  p95_latency_ms?: number;
};

export type ProviderStats = {
  provider: string;
  cost: number;
  requests: number;
  tokens: number;
  pct?: number | null;
};

export type RequestLogItem = {
  id: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  latency_ms: number;
  status: number;
  feature?: string | null;
  endpoint?: string | null;
  prompt_preview?: string | null;
  completion_preview?: string | null;
  created_at: string;
};

export type RequestLogPage = {
  total: number;
  limit: number;
  offset: number;
  items: RequestLogItem[];
};

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined | null>): Promise<T> {
  const url = buildUrl(path, params);
  console.log(`[API REQUEST] ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) message = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }
  const data = await response.json();
  console.log(`[API RESPONSE] ${path}`, data);
  return data as T;
}

export const analyticsApi = {
  overview: (range: AnalyticsRange) => apiGet<OverviewMetrics>("/analytics/overview", { range }),
  costTrend: (range: AnalyticsRange) => apiGet<TrendPoint[]>("/analytics/cost-trend", { range }),
  tokenTrend: (range: AnalyticsRange) => apiGet<TrendPoint[]>("/analytics/token-trend", { range }),
  providers: (range: AnalyticsRange) => apiGet<ProviderStats[]>("/analytics/providers", { range }),
  providerBreakdown: (range: AnalyticsRange) => apiGet<ProviderStats[]>("/analytics/provider-breakdown", { range }),
  requestVolume: (range: AnalyticsRange) => apiGet<TrendPoint[]>("/analytics/request-volume", { range }),
  latencyTrend: (range: AnalyticsRange) => apiGet<TrendPoint[]>("/analytics/latency-trend", { range }),
  requests: (params: {
    limit?: number;
    offset?: number;
    range?: AnalyticsRange;
    status?: "success" | "error";
    provider?: string;
    q?: string;
  }) =>
    apiGet<RequestLogPage>("/analytics/requests", {
      limit: params.limit,
      offset: params.offset,
      range: params.range,
      status: params.status,
      provider: params.provider,
      q: params.q,
    }),
};
