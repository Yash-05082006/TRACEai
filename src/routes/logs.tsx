import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useMemo, useState } from "react";
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
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/tooltip";

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

type Status = 200 | 201 | 400 | 401 | 429 | 500 | 504;

type Req = {
  id: string;
  ts: string;
  tsOffsetHours: number; // hours ago from "now" for time filter simulation
  provider: "OpenAI" | "Anthropic" | "Google" | "DeepSeek" | "Groq";
  model: string;
  inTok: number;
  outTok: number;
  cost: number;
  latencyMs: number;
  ttftMs: number;
  completionMs: number;
  status: Status;
  prompt: string;
  completion: string;
  feature: string;
  userId: string;
  sessionId: string;
  tags: string[];
  trace: { label: string; offsetMs: number }[];
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const REQS: Req[] = [
  {
    id: "req_8af21c",
    ts: "2026-06-15 11:32:18",
    tsOffsetHours: 0.5,
    provider: "OpenAI",
    model: "gpt-4o",
    inTok: 1248,
    outTok: 412,
    cost: 0.0186,
    latencyMs: 1840,
    ttftMs: 320,
    completionMs: 1520,
    status: 200,
    feature: "doc-summarizer",
    userId: "u_8421",
    sessionId: "sess_a3f91",
    tags: ["production", "summarization"],
    prompt:
      "Summarize the following quarterly report into 5 bullet points focusing on revenue, margin, and forward guidance.\n\n[DOCUMENT START]\nFiscal Q2 2026 - Acme Corp Earnings Report\nRevenue: $2.4B (+18% YoY)\nGross Margin: 68% (+220bps)\nOperating Margin: 31%\nCloud Segment: $1.0B (42% of total)\nGuidance FY26: $10.2-10.5B revenue\nBuyback authorized: $1B\n[DOCUMENT END]",
    completion:
      "• Revenue grew 18% YoY to $2.4B, beating consensus of $2.31B\n• Operating margin expanded 220bps to 31%, driven by cloud mix shift\n• Cloud segment now represents 42% of total revenue at $1.0B\n• FY26 guidance raised to $10.2-10.5B revenue (prev. $9.8-10.2B)\n• $1B share buyback authorized; signals management confidence in cash generation",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 4 },
      { label: "Sent to provider", offsetMs: 8 },
      { label: "First token received", offsetMs: 320 },
      { label: "Response completed", offsetMs: 1840 },
    ],
  },
  {
    id: "req_8af21b",
    ts: "2026-06-15 10:58:14",
    tsOffsetHours: 1.2,
    provider: "Anthropic",
    model: "claude-sonnet-4-5",
    inTok: 842,
    outTok: 284,
    cost: 0.0094,
    latencyMs: 1240,
    ttftMs: 280,
    completionMs: 960,
    status: 200,
    feature: "customer-support",
    userId: "u_3920",
    sessionId: "sess_b7c42",
    tags: ["production", "support", "billing"],
    prompt:
      "A customer is asking why their invoice shows a charge for $49 when they expected $29. Here is context:\n- Customer upgraded from Starter ($29/mo) to Pro ($49/mo) on June 2\n- Invoice was generated on June 5\n- Customer did not receive an upgrade confirmation email\n\nDraft a friendly, clear reply explaining the discrepancy.",
    completion:
      "Hi there - thanks for reaching out and flagging this!\n\nThe $49 charge reflects the Pro tier you upgraded to on June 2nd. Because your billing cycle runs from the 5th of each month, this invoice captures your first full month at the Pro rate.\n\nIf you didn't receive the upgrade confirmation email, it's possible it landed in your spam folder - worth a quick check. I've also resent it to the address on file.\n\nIf you believe this upgrade was made in error, I'm happy to process a refund and revert your plan. Just let me know! 😊",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 3 },
      { label: "Sent to provider", offsetMs: 7 },
      { label: "First token received", offsetMs: 280 },
      { label: "Response completed", offsetMs: 1240 },
    ],
  },
  {
    id: "req_8af21a",
    ts: "2026-06-15 10:12:10",
    tsOffsetHours: 2.1,
    provider: "OpenAI",
    model: "gpt-4o-mini",
    inTok: 312,
    outTok: 84,
    cost: 0.0001,
    latencyMs: 480,
    ttftMs: 120,
    completionMs: 360,
    status: 200,
    feature: "customer-support",
    userId: "u_2018",
    sessionId: "sess_c9d12",
    tags: ["production", "classification", "fast-path"],
    prompt:
      "Classify this support ticket into exactly one of the following categories:\nbilling, technical, account, feature-request, feedback\n\nTicket: 'I've been trying to connect my Salesforce integration for 2 hours and the OAuth handshake keeps failing. Error code: OAUTH_SCOPE_MISMATCH'",
    completion: "technical",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 2 },
      { label: "Cache miss", offsetMs: 5 },
      { label: "Sent to provider", offsetMs: 6 },
      { label: "First token received", offsetMs: 120 },
      { label: "Response completed", offsetMs: 480 },
    ],
  },
  {
    id: "req_8af219",
    ts: "2026-06-15 09:45:42",
    tsOffsetHours: 2.8,
    provider: "OpenAI",
    model: "text-embedding-3-small",
    inTok: 1840,
    outTok: 0,
    cost: 0.00004,
    latencyMs: 210,
    ttftMs: 210,
    completionMs: 0,
    status: 200,
    feature: "search-rag",
    userId: "u_1182",
    sessionId: "sess_d0e83",
    tags: ["production", "embeddings", "batch"],
    prompt:
      "Batch embedding request - 12 document chunks for vector upsert into Pinecone. Collection: customer-support-kb. Avg chunk size: 153 tokens.",
    completion: "[1536-dimensional vectors × 12 chunks returned successfully]",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 2 },
      { label: "Sent to provider", offsetMs: 5 },
      { label: "Response completed", offsetMs: 210 },
    ],
  },
  {
    id: "req_8af218",
    ts: "2026-06-15 08:20:05",
    tsOffsetHours: 4.2,
    provider: "Anthropic",
    model: "claude-sonnet-4-5",
    inTok: 3420,
    outTok: 1284,
    cost: 0.0289,
    latencyMs: 4820,
    ttftMs: 410,
    completionMs: 4410,
    status: 200,
    feature: "code-assistant",
    userId: "u_9921",
    sessionId: "sess_e1f74",
    tags: ["production", "code-gen", "refactor"],
    prompt:
      "Refactor this React component to:\n1. Extract data fetching into a custom hook using TanStack Query\n2. Split the view into a dumb presentation component\n3. Add proper loading and error states\n4. Add TypeScript types throughout\n\n```tsx\nexport function UserPosts({ userId }) {\n  const [posts, setPosts] = useState(null);\n  useEffect(() => {\n    fetch(`/api/users/${userId}/posts`).then(r => r.json()).then(setPosts);\n  }, [userId]);\n  if (!posts) return <div>Loading...</div>;\n  return posts.map(p => <div key={p.id}>{p.title}</div>);\n}\n```",
    completion:
      "// useUserPosts.ts\nexport function useUserPosts(userId: string) {\n  return useQuery({\n    queryKey: ['user-posts', userId],\n    queryFn: () => fetch(`/api/users/${userId}/posts`).then(r => {\n      if (!r.ok) throw new Error('Failed to fetch posts');\n      return r.json() as Promise<Post[]>;\n    }),\n  });\n}\n\n// PostsView.tsx\ntype Props = { posts: Post[] };\nexport function PostsView({ posts }: Props) {\n  return (\n    <ul className=\"space-y-2\">\n      {posts.map(p => <li key={p.id}>{p.title}</li>)}\n    </ul>\n  );\n}\n\n// UserPosts.tsx  \nexport function UserPosts({ userId }: { userId: string }) {\n  const { data, isLoading, error } = useUserPosts(userId);\n  if (isLoading) return <Skeleton />;\n  if (error) return <ErrorBoundary error={error} />;\n  return <PostsView posts={data!} />;\n}",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 3 },
      { label: "Sent to provider", offsetMs: 8 },
      { label: "First token received", offsetMs: 410 },
      { label: "Response completed", offsetMs: 4820 },
    ],
  },
  {
    id: "req_8af217",
    ts: "2026-06-15 06:48:11",
    tsOffsetHours: 5.8,
    provider: "OpenAI",
    model: "gpt-4o",
    inTok: 642,
    outTok: 0,
    cost: 0.0032,
    latencyMs: 2200,
    ttftMs: 0,
    completionMs: 0,
    status: 429,
    feature: "doc-summarizer",
    userId: "u_8421",
    sessionId: "sess_f2g65",
    tags: ["production", "rate-limited"],
    prompt:
      "Summarize this earnings call transcript focusing on management guidance for the next quarter...",
    completion: "",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 3 },
      { label: "Sent to provider", offsetMs: 7 },
      { label: "Rate limit exceeded (429)", offsetMs: 2200 },
    ],
  },
  {
    id: "req_8af216",
    ts: "2026-06-14 23:15:08",
    tsOffsetHours: 13.4,
    provider: "Google",
    model: "gemini-1.5-pro",
    inTok: 2840,
    outTok: 612,
    cost: 0.0089,
    latencyMs: 2080,
    ttftMs: 380,
    completionMs: 1700,
    status: 200,
    feature: "search-rag",
    userId: "u_7720",
    sessionId: "sess_g3h56",
    tags: ["production", "rag", "policy-qa"],
    prompt:
      "You are a helpful assistant with access to the company knowledge base.\n\nContext (retrieved):\n---\nRefund Policy (updated June 2026): Full refunds are available within 14 days of purchase. After 14 days, pro-rated credits are offered for annual plans. Monthly plans are non-refundable after the billing date.\n---\n\nUser question: What is the company's refund policy for annual plans cancelled after 30 days?",
    completion:
      "Based on the company policy, annual plans cancelled after 30 days are eligible for pro-rated credits - not a cash refund. For example, if you cancel a 12-month plan after 3 months, you'd receive credits equivalent to the remaining 9 months, which can be applied to future purchases.\n\nFull cash refunds are only available within the first 14 days of purchase.\n\nWould you like me to initiate a credit issuance for your account?",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 4 },
      { label: "Sent to provider", offsetMs: 9 },
      { label: "First token received", offsetMs: 380 },
      { label: "Response completed", offsetMs: 2080 },
    ],
  },
  {
    id: "req_8af215",
    ts: "2026-06-14 19:02:44",
    tsOffsetHours: 17.5,
    provider: "Anthropic",
    model: "claude-haiku-4-5",
    inTok: 184,
    outTok: 62,
    cost: 0.0002,
    latencyMs: 380,
    ttftMs: 95,
    completionMs: 285,
    status: 200,
    feature: "customer-support",
    userId: "u_4412",
    sessionId: "sess_h4i47",
    tags: ["production", "translation", "fast-path"],
    prompt:
      "Translate the following text to Spanish. Output only the translation, no additional commentary.\n\nText: 'Your subscription has been renewed successfully. Your next billing date is July 5, 2026.'",
    completion:
      "Tu suscripción ha sido renovada exitosamente. Tu próxima fecha de facturación es el 5 de julio de 2026.",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 2 },
      { label: "Cache miss", offsetMs: 4 },
      { label: "Sent to provider", offsetMs: 6 },
      { label: "First token received", offsetMs: 95 },
      { label: "Response completed", offsetMs: 380 },
    ],
  },
  {
    id: "req_8af214",
    ts: "2026-06-14 14:22:10",
    tsOffsetHours: 22.2,
    provider: "OpenAI",
    model: "gpt-4o",
    inTok: 4820,
    outTok: 0,
    cost: 0.0241,
    latencyMs: 8200,
    ttftMs: 0,
    completionMs: 0,
    status: 500,
    feature: "code-assistant",
    userId: "u_9921",
    sessionId: "sess_i5j38",
    tags: ["production", "error", "schema-migration"],
    prompt:
      "Generate a full Postgres migration script for the following schema changes:\n- Add `subscription_tier` ENUM column to `users` table\n- Add index on `users.created_at` and `users.subscription_tier`\n- Backfill `subscription_tier` based on `billing_plan` column\n- Drop deprecated `billing_plan` column\n- Create new `subscription_events` audit table\n[schema follows - 3,800 tokens]",
    completion: "",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 4 },
      { label: "Sent to provider", offsetMs: 9 },
      { label: "Provider error (500)", offsetMs: 8200 },
    ],
  },
  {
    id: "req_8af213",
    ts: "2026-06-13 21:10:50",
    tsOffsetHours: 38.5,
    provider: "DeepSeek",
    model: "deepseek-v3",
    inTok: 1240,
    outTok: 380,
    cost: 0.0004,
    latencyMs: 940,
    ttftMs: 220,
    completionMs: 720,
    status: 200,
    feature: "internal-tools",
    userId: "u_2218",
    sessionId: "sess_j6k29",
    tags: ["internal", "data-engineering", "sql-to-pandas"],
    prompt:
      "Convert the following SQL query to equivalent Pandas code. Return only the Python code, no explanation.\n\n```sql\nSELECT region, SUM(revenue) as total_revenue\nFROM sales\nWHERE date >= '2026-01-01'\nGROUP BY region\nORDER BY total_revenue DESC\nLIMIT 10;\n```",
    completion:
      "```python\nimport pandas as pd\n\nresult = (\n    sales[sales['date'] >= '2026-01-01']\n    .groupby('region', as_index=False)['revenue']\n    .sum()\n    .rename(columns={'revenue': 'total_revenue'})\n    .sort_values('total_revenue', ascending=False)\n    .head(10)\n)\n```",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 3 },
      { label: "Sent to provider", offsetMs: 7 },
      { label: "First token received", offsetMs: 220 },
      { label: "Response completed", offsetMs: 940 },
    ],
  },
  {
    id: "req_8af212",
    ts: "2026-06-13 08:45:00",
    tsOffsetHours: 51.2,
    provider: "OpenAI",
    model: "gpt-4o-mini",
    inTok: 240,
    outTok: 92,
    cost: 0.0001,
    latencyMs: 420,
    ttftMs: 110,
    completionMs: 310,
    status: 200,
    feature: "customer-support",
    userId: "u_3812",
    sessionId: "sess_k7l10",
    tags: ["production", "sentiment", "fast-path"],
    prompt:
      "Perform sentiment analysis on the following customer review. Output a JSON object with keys: sentiment (positive/negative/mixed/neutral), confidence (0.0-1.0), key_phrases (array of max 3).\n\nReview: 'I love this product but the shipping was really slow. Quality is excellent though!'",
    completion:
      '{\n  "sentiment": "mixed",\n  "confidence": 0.91,\n  "key_phrases": ["love this product", "shipping was really slow", "quality is excellent"]\n}',
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 2 },
      { label: "Cache miss", offsetMs: 5 },
      { label: "Sent to provider", offsetMs: 7 },
      { label: "First token received", offsetMs: 110 },
      { label: "Response completed", offsetMs: 420 },
    ],
  },
  {
    id: "req_8af211",
    ts: "2026-06-12 04:18:35",
    tsOffsetHours: 80.0,
    provider: "Anthropic",
    model: "claude-sonnet-4-5",
    inTok: 980,
    outTok: 0,
    cost: 0.0029,
    latencyMs: 3400,
    ttftMs: 0,
    completionMs: 0,
    status: 504,
    feature: "doc-summarizer",
    userId: "u_4412",
    sessionId: "sess_l8m01",
    tags: ["production", "timeout", "error"],
    prompt:
      "Summarize the attached 30-page compliance document. Focus on: 1) Key regulatory requirements, 2) Implementation deadlines, 3) Penalties for non-compliance, 4) Required internal controls.",
    completion: "",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 4 },
      { label: "Sent to provider", offsetMs: 8 },
      { label: "Gateway timeout (504)", offsetMs: 3400 },
    ],
  },
  {
    id: "req_8af210",
    ts: "2026-06-10 15:20:00",
    tsOffsetHours: 165.0,
    provider: "Groq",
    model: "llama-3.3-70b",
    inTok: 520,
    outTok: 180,
    cost: 0.0003,
    latencyMs: 290,
    ttftMs: 80,
    completionMs: 210,
    status: 200,
    feature: "search-rag",
    userId: "u_6614",
    sessionId: "sess_m9n92",
    tags: ["production", "rag", "ultra-fast"],
    prompt:
      "Based on the retrieved context below, answer the user's question concisely.\n\nContext: [Acme Product FAQ - Returns section]\n\nUser: Can I return a digital product?",
    completion:
      "Digital products (software licenses, API credits, digital downloads) are non-returnable once activated or accessed. If you believe there's been an error, please contact support within 48 hours of purchase.",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 2 },
      { label: "Cache miss", offsetMs: 4 },
      { label: "Sent to provider", offsetMs: 6 },
      { label: "First token received", offsetMs: 80 },
      { label: "Response completed", offsetMs: 290 },
    ],
  },
  {
    id: "req_8af20f",
    ts: "2026-06-08 10:10:22",
    tsOffsetHours: 218.0,
    provider: "OpenAI",
    model: "gpt-4o",
    inTok: 2140,
    outTok: 820,
    cost: 0.0148,
    latencyMs: 3120,
    ttftMs: 290,
    completionMs: 2830,
    status: 200,
    feature: "code-assistant",
    userId: "u_5520",
    sessionId: "sess_n0o83",
    tags: ["production", "code-review"],
    prompt:
      "Review this pull request diff and provide feedback:\n1. Security vulnerabilities\n2. Performance issues\n3. Code style & readability\n4. Test coverage gaps\n\n```diff\n+function getUserData(userId) {\n+  const query = `SELECT * FROM users WHERE id = ${userId}`;\n+  return db.execute(query);\n+}\n```",
    completion:
      "## Code Review - Critical Issues Found\n\n### 🔴 Security: SQL Injection (Critical)\nLine 2 uses string interpolation to build a SQL query, making it **directly vulnerable to SQL injection**.\n\n**Fix:**\n```js\nconst query = 'SELECT * FROM users WHERE id = ?';\nreturn db.execute(query, [userId]);\n```\n\n### 🟡 Performance\n- `SELECT *` fetches all columns; specify only needed fields\n- No index hint - ensure `users.id` is indexed (likely primary key, OK)\n\n### 🟢 Style\n- Missing JSDoc/type annotations\n- Function should be async if `db.execute` is async\n\n### ⚠️ Test Gaps\n- No test for SQL injection input\n- No test for non-existent userId",
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 3 },
      { label: "Sent to provider", offsetMs: 7 },
      { label: "First token received", offsetMs: 290 },
      { label: "Response completed", offsetMs: 3120 },
    ],
  },
  {
    id: "req_8af20e",
    ts: "2026-06-01 08:00:00",
    tsOffsetHours: 723.0,
    provider: "Google",
    model: "gemini-2.0-flash",
    inTok: 380,
    outTok: 142,
    cost: 0.0002,
    latencyMs: 520,
    ttftMs: 140,
    completionMs: 380,
    status: 200,
    feature: "internal-tools",
    userId: "u_1890",
    sessionId: "sess_o1p74",
    tags: ["internal", "data-extraction", "fast-path"],
    prompt:
      "Extract the following fields from this unstructured text and return as JSON:\n- company_name\n- contact_email\n- annual_revenue\n- employee_count\n\nText: 'GlobalTech Solutions (globaltech@example.com) reported $4.2M ARR last quarter with a team of 38 engineers.'",
    completion:
      '{\n  "company_name": "GlobalTech Solutions",\n  "contact_email": "globaltech@example.com",\n  "annual_revenue": "$4.2M ARR",\n  "employee_count": 38\n}',
    trace: [
      { label: "Request received", offsetMs: 0 },
      { label: "Auth validated", offsetMs: 2 },
      { label: "Cache miss", offsetMs: 4 },
      { label: "Sent to provider", offsetMs: 6 },
      { label: "First token received", offsetMs: 140 },
      { label: "Response completed", offsetMs: 520 },
    ],
  },
];

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

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "bg-[#10A37F]/10 text-[#10A37F]",
  Anthropic: "bg-[#D97757]/10 text-[#D97757]",
  Google: "bg-[#4285F4]/10 text-[#4285F4]",
  DeepSeek: "bg-[#4D6BFE]/10 text-[#4D6BFE]",
  Groq: "bg-[#F55036]/10 text-[#F55036]",
};

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

  const updateSearch = (newSearch: Partial<LogsSearch>) => {
    navigate({
      search: (prev) => ({ ...prev, ...newSearch }),
      replace: true,
    });
  };

  const setQ = (v: string) => updateSearch({ q: v || undefined });
  const setStatusFilter = (v: any) => updateSearch({ status: v === "all" ? undefined : v });
  const setProviderFilter = (v: string) => updateSearch({ provider: v === "all" ? undefined : v, model: undefined });
  const setModelFilter = (v: string) => updateSearch({ model: v === "all" ? undefined : v });
  const setTimeFilter = (v: any) => updateSearch({ time: v === "24h" ? undefined : v });

  const providers = useMemo(() => Array.from(new Set(REQS.map((r) => r.provider))).sort(), []);
  const models = useMemo(
    () =>
      Array.from(
        new Set(
          REQS.filter((r) => providerFilter === "all" || r.provider === providerFilter).map(
            (r) => r.model,
          ),
        ),
      ).sort(),
    [providerFilter],
  );

  const timeFilterHours = { "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720 }[timeFilter] ?? 24;

  const rows = REQS.filter((r) => {
    if (r.tsOffsetHours > timeFilterHours) return false;
    if (statusFilter === "success" && r.status >= 400) return false;
    if (statusFilter === "error" && r.status < 400) return false;
    if (providerFilter !== "all" && r.provider !== providerFilter) return false;
    if (modelFilter !== "all" && r.model !== modelFilter) return false;
    if (q) {
      const needle = q.toLowerCase();
      const hay =
        `${r.id} ${r.model} ${r.feature} ${r.userId} ${r.prompt} ${r.provider}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const hasActiveFilters =
    q || statusFilter !== "all" || providerFilter !== "all" || modelFilter !== "all" || timeFilter !== "24h";

  return (
    <AppShell
      title="Request Explorer"
      subtitle="Every captured LLM request - searchable, filterable, drill-down to prompt and completion."
      actions={
        <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
          <span className="font-semibold text-[#0F172A]">{rows.length}</span> of {REQS.length}{" "}
          requests
        </div>
      }
    >
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
                  { label: "Timestamp", align: "left", tooltip: "When the request was received by the TRACEai proxy (UTC). Used for time-range filtering." },
                  { label: "Request ID", align: "left", tooltip: "Unique identifier assigned by TRACEai to every captured request. Use for debugging and tracing." },
                  { label: "Provider", align: "left", tooltip: "The upstream LLM provider this request was forwarded to (e.g., OpenAI, Anthropic, Google)." },
                  { label: "Model", align: "left", tooltip: "The specific model variant called. More capable models cost more per token." },
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
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
                      <td className="px-4 py-3 font-mono text-[11px] font-medium text-[#0F172A]">
                        {r.id}
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
                  ["Provider", req.provider],
                  ["Model", <span className="font-mono">{req.model}</span>],
                  ["Feature", req.feature],
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
