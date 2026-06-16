const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
const API_BASE = envUrl ?? "http://127.0.0.1:8004";

console.log(`[STARTUP] Resolved API_BASE: ${API_BASE}`);
console.log(`[STARTUP] Source: ${envUrl ? "env (VITE_API_URL)" : "fallback (default 127.0.0.1:8004)"}`);

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

export type ApplicationStats = {
  application_name: string;
  cost: number;
  requests: number;
  tokens: number;
};

export type EndpointStats = {
  endpoint: string;
  cost: number;
  requests: number;
  tokens: number;
  avg_latency_ms: number;
  error_rate: number;
  pct?: number | null;
};

export type FeatureStats = {
  feature: string;
  cost: number;
  requests: number;
  tokens: number;
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
  application_name?: string;
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
  applications: (range: AnalyticsRange) => apiGet<ApplicationStats[]>("/analytics/applications", { range }),
  endpoints: (range: AnalyticsRange) => apiGet<EndpointStats[]>("/analytics/endpoints", { range }),
  features: (range: AnalyticsRange) => apiGet<FeatureStats[]>("/analytics/features", { range }),
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

export type Application = {
  id: string;
  application_name: string;
  provider: string;
  trace_key: string;
  base_url?: string;
  description?: string;
  proxy_url: string;
  endpoints: ApplicationEndpoint[];
};

export type ApplicationEndpoint = {
  id: string;
  endpoint_name: string;
  endpoint_path: string;
  request_method: string;
  feature?: string;
  description?: string;
};

export const applicationsApi = {
  list: () => apiGet<Application[]>("/applications"),
  get: (id: string) => apiGet<Application>(`/applications/${id}`),
  create: (data: any) =>
    fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to create application");
      return res.json() as Promise<Application>;
    }),
  createEndpoint: (appId: string, data: any) =>
    fetch(`${API_BASE}/applications/${appId}/endpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to create endpoint");
      return res.json() as Promise<ApplicationEndpoint>;
    }),
  updateEndpoint: (appId: string, endpointId: string, data: any) =>
    fetch(`${API_BASE}/applications/${appId}/endpoints/${endpointId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to update endpoint");
      return res.json() as Promise<ApplicationEndpoint>;
    }),
  deleteEndpoint: (appId: string, endpointId: string) =>
    fetch(`${API_BASE}/applications/${appId}/endpoints/${endpointId}`, {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to delete endpoint");
    }),
};
