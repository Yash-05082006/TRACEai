import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { useMemo, useState } from "react";
import { Search, X, Copy, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Request Explorer — TRACEai" },
      {
        name: "description",
        content:
          "Inspect every LLM request: prompt, completion, tokens, latency, cost, and status.",
      },
    ],
  }),
  component: RequestExplorerPage,
});

type Req = {
  id: string;
  ts: string;
  endpoint: string;
  provider: string;
  model: string;
  inTok: number;
  outTok: number;
  cost: number;
  latencyMs: number;
  ttftMs: number;
  status: number;
  prompt: string;
  completion: string;
  feature: string;
  user: string;
};

const REQS: Req[] = [
  { id: "req_8af21c", ts: "2026-06-14 14:32:18.412", endpoint: "/v1/chat/completions", provider: "OpenAI", model: "gpt-4o", inTok: 1248, outTok: 412, cost: 0.0186, latencyMs: 1840, ttftMs: 320, status: 200, feature: "doc-summarizer", user: "u_8421", prompt: "Summarize the following quarterly report into 5 bullet points focusing on revenue, margin, and forward guidance...", completion: "• Revenue grew 18% YoY to $2.4B\n• Operating margin expanded 220bps to 31%\n• Cloud segment now 42% of total revenue\n• Guidance raised: FY26 revenue $10.2-10.5B\n• Buyback of $1B authorized" },
  { id: "req_8af21b", ts: "2026-06-14 14:32:18.108", endpoint: "/v1/messages", provider: "Anthropic", model: "claude-sonnet-4-5", inTok: 842, outTok: 284, cost: 0.0094, latencyMs: 1240, ttftMs: 280, status: 200, feature: "customer-support", user: "u_3920", prompt: "A customer is asking why their invoice shows a charge for $49 when they expected $29. Draft a friendly reply.", completion: "Hi there — thanks for flagging this. The $49 charge reflects the Pro tier you upgraded to on June 2..." },
  { id: "req_8af21a", ts: "2026-06-14 14:32:17.984", endpoint: "/v1/chat/completions", provider: "OpenAI", model: "gpt-4o-mini", inTok: 312, outTok: 84, cost: 0.0001, latencyMs: 480, ttftMs: 120, status: 200, feature: "customer-support", user: "u_2018", prompt: "Classify this support ticket into one of: billing, technical, account, feedback.", completion: "billing" },
  { id: "req_8af219", ts: "2026-06-14 14:32:17.622", endpoint: "/v1/embeddings", provider: "OpenAI", model: "text-embedding-3-small", inTok: 1840, outTok: 0, cost: 0.00004, latencyMs: 210, ttftMs: 210, status: 200, feature: "search-rag", user: "u_1182", prompt: "Embedding batch (12 docs)", completion: "[1536-dim vectors × 12]" },
  { id: "req_8af218", ts: "2026-06-14 14:32:17.401", endpoint: "/v1/messages", provider: "Anthropic", model: "claude-sonnet-4-5", inTok: 3420, outTok: 1284, cost: 0.0289, latencyMs: 4820, ttftMs: 410, status: 200, feature: "code-assistant", user: "u_9921", prompt: "Refactor this React component to use TanStack Query and split into a hook + view...", completion: "// Created useUserPosts hook and PostsView component\nexport function useUserPosts() { ... }" },
  { id: "req_8af217", ts: "2026-06-14 14:32:16.940", endpoint: "/v1/chat/completions", provider: "OpenAI", model: "gpt-4o", inTok: 642, outTok: 0, cost: 0.0032, latencyMs: 2200, ttftMs: 0, status: 429, feature: "doc-summarizer", user: "u_8421", prompt: "Summarize this transcript...", completion: "" },
  { id: "req_8af216", ts: "2026-06-14 14:32:16.512", endpoint: "/v1/chat/completions", provider: "Google", model: "gemini-1.5-pro", inTok: 2840, outTok: 612, cost: 0.0089, latencyMs: 2080, ttftMs: 380, status: 200, feature: "search-rag", user: "u_7720", prompt: "Given the following retrieved context, answer: what is the company's refund policy?", completion: "Per the support policy, full refunds are available within 14 days of purchase..." },
  { id: "req_8af215", ts: "2026-06-14 14:32:16.198", endpoint: "/v1/messages", provider: "Anthropic", model: "claude-haiku-4-5", inTok: 184, outTok: 62, cost: 0.0002, latencyMs: 380, ttftMs: 95, status: 200, feature: "customer-support", user: "u_4412", prompt: "Translate to Spanish: 'Your subscription has been renewed.'", completion: "Tu suscripción ha sido renovada." },
  { id: "req_8af214", ts: "2026-06-14 14:32:15.820", endpoint: "/v1/chat/completions", provider: "OpenAI", model: "gpt-4o", inTok: 4820, outTok: 0, cost: 0.0241, latencyMs: 8200, ttftMs: 0, status: 500, feature: "code-assistant", user: "u_9921", prompt: "Generate a full migration script for the schema changes below...", completion: "" },
  { id: "req_8af213", ts: "2026-06-14 14:32:15.412", endpoint: "/v1/chat/completions", provider: "DeepSeek", model: "deepseek-v3", inTok: 1240, outTok: 380, cost: 0.0004, latencyMs: 940, ttftMs: 220, status: 200, feature: "internal-tools", user: "u_2218", prompt: "Convert this SQL query into a Pandas dataframe operation...", completion: "df.groupby('region')['revenue'].sum().sort_values(ascending=False)" },
  { id: "req_8af212", ts: "2026-06-14 14:32:14.998", endpoint: "/v1/chat/completions", provider: "OpenAI", model: "gpt-4o-mini", inTok: 240, outTok: 92, cost: 0.0001, latencyMs: 420, ttftMs: 110, status: 200, feature: "customer-support", user: "u_3812", prompt: "Categorize sentiment: 'I love this product but the shipping was slow.'", completion: "mixed" },
  { id: "req_8af211", ts: "2026-06-14 14:32:14.610", endpoint: "/v1/messages", provider: "Anthropic", model: "claude-sonnet-4-5", inTok: 980, outTok: 0, cost: 0.0029, latencyMs: 3400, ttftMs: 0, status: 504, feature: "doc-summarizer", user: "u_4412", prompt: "Summarize this 30-page PDF...", completion: "" },
];

function statusClasses(s: number) {
  if (s >= 200 && s < 300) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (s === 429) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

function RequestExplorerPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "success" | "error">("all");
  const [provider, setProvider] = useState<string>("all");
  const [selected, setSelected] = useState<Req | null>(null);

  const providers = useMemo(
    () => Array.from(new Set(REQS.map((r) => r.provider))),
    [],
  );

  const rows = REQS.filter((r) => {
    if (status === "success" && r.status >= 400) return false;
    if (status === "error" && r.status < 400) return false;
    if (provider !== "all" && r.provider !== provider) return false;
    if (q) {
      const needle = q.toLowerCase();
      const hay = `${r.id} ${r.endpoint} ${r.model} ${r.feature} ${r.user} ${r.prompt}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  return (
    <AppShell
      title="Request Explorer"
      subtitle="Every captured LLM request — searchable, filterable, drill-down to prompt and completion."
    >
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#0F172A]/8 p-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by request ID, endpoint, model, feature, user, or prompt content…"
              className="w-full rounded-lg border border-[#0F172A]/10 bg-white py-2 pl-9 pr-3 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[12px] font-medium text-[#0F172A]"
          >
            <option value="all">All providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="inline-flex rounded-lg border border-[#0F172A]/8 bg-white p-0.5">
            {(["all", "success", "error"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-md px-3 py-1 text-[12px] font-medium capitalize transition-colors ${
                  status === s
                    ? "bg-[#0F172A] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto text-[12px] text-[#64748B]">
            <span className="font-semibold text-[#0F172A]">{rows.length}</span>{" "}
            of {REQS.length} requests
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-[#F8FAFC] text-[10px] uppercase tracking-wider text-[#94A3B8]">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Timestamp</th>
                <th className="px-3 py-2 text-left font-medium">Endpoint</th>
                <th className="px-3 py-2 text-left font-medium">Provider</th>
                <th className="px-3 py-2 text-left font-medium">Model</th>
                <th className="px-3 py-2 text-right font-medium">Input</th>
                <th className="px-3 py-2 text-right font-medium">Output</th>
                <th className="px-3 py-2 text-right font-medium">Cost</th>
                <th className="px-3 py-2 text-right font-medium">Latency</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`cursor-pointer border-t border-[#0F172A]/[0.05] transition-colors hover:bg-[#2563EB]/[0.04] ${
                    selected?.id === r.id ? "bg-[#2563EB]/[0.06]" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[#64748B]">
                    {r.ts}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[#0F172A]">
                    {r.endpoint}
                  </td>
                  <td className="px-3 py-2.5 text-[#0F172A]">{r.provider}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[#475569]">
                    {r.model}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#475569]">
                    {r.inTok.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#475569]">
                    {r.outTok.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium text-[#0F172A]">
                    ${r.cost.toFixed(4)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#475569]">
                    {r.latencyMs} ms
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusClasses(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#94A3B8]">
                    <ChevronRight className="ml-auto h-3.5 w-3.5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <DetailDrawer req={selected} onClose={() => setSelected(null)} />
      )}
    </AppShell>
  );
}

function DetailDrawer({ req, onClose }: { req: Req; onClose: () => void }) {
  const totalTok = req.inTok + req.outTok;
  // approx cost split
  const inCost = req.inTok > 0 ? (req.cost * req.inTok) / Math.max(1, totalTok) : 0;
  const outCost = req.cost - inCost;
  const proxy = 6;
  const queue = req.ttftMs > 0 ? req.ttftMs - proxy : 0;
  const generation = Math.max(0, req.latencyMs - req.ttftMs);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-[#0F172A]/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-[640px] overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#0F172A]/8 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <div className="font-mono text-[12px] text-[#94A3B8]">{req.id}</div>
            <div className="text-[16px] font-semibold text-[#0F172A]">
              {req.endpoint}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#475569] hover:bg-[#0F172A]/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <Section title="Prompt Preview" copy={req.prompt}>
            <pre className="whitespace-pre-wrap rounded-lg border border-[#0F172A]/8 bg-[#F8FAFC] p-3 font-mono text-[12px] leading-relaxed text-[#0F172A]">
              {req.prompt}
            </pre>
          </Section>

          <Section title="Completion Preview" copy={req.completion}>
            <pre className="whitespace-pre-wrap rounded-lg border border-[#0F172A]/8 bg-[#F8FAFC] p-3 font-mono text-[12px] leading-relaxed text-[#0F172A]">
              {req.completion || (
                <span className="text-[#94A3B8]">
                  (no completion — request failed with status {req.status})
                </span>
              )}
            </pre>
          </Section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Breakdown
              title="Token Breakdown"
              rows={[
                ["Input", req.inTok.toLocaleString()],
                ["Output", req.outTok.toLocaleString()],
                ["Total", totalTok.toLocaleString()],
              ]}
            />
            <Breakdown
              title="Cost Breakdown"
              rows={[
                ["Input", `$${inCost.toFixed(5)}`],
                ["Output", `$${outCost.toFixed(5)}`],
                ["Total", `$${req.cost.toFixed(5)}`],
              ]}
            />
            <Breakdown
              title="Latency Breakdown"
              rows={[
                ["Proxy", `${proxy} ms`],
                ["TTFT", `${req.ttftMs} ms`],
                ["Generation", `${generation} ms`],
                ["Total", `${req.latencyMs} ms`],
              ]}
            />
          </div>

          <Section title="Request Metadata">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
              {[
                ["Provider", req.provider],
                ["Model", req.model],
                ["Feature", req.feature],
                ["User", req.user],
                ["Status", String(req.status)],
                ["Timestamp", req.ts],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-dashed border-[#0F172A]/8 py-1">
                  <dt className="text-[#94A3B8]">{k}</dt>
                  <dd className="font-mono text-[#0F172A]">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  copy,
  children,
}: {
  title: string;
  copy?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8]">
          {title}
        </h3>
        {copy && (
          <button
            onClick={() => navigator.clipboard?.writeText(copy)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#475569] hover:text-[#2563EB]"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-[#0F172A]/8 bg-white p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
        {title}
      </div>
      <ul className="space-y-1.5 text-[12px]">
        {rows.map(([k, v]) => (
          <li
            key={k}
            className="flex items-center justify-between border-b border-dashed border-[#0F172A]/8 pb-1 last:border-0 last:pb-0"
          >
            <span className="text-[#64748B]">{k}</span>
            <span className="font-mono font-medium text-[#0F172A]">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
