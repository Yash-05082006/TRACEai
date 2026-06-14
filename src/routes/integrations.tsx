import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — TRACEai" },
      {
        name: "description",
        content:
          "Onboard an LLM provider in under 5 minutes. Route traffic through the TRACEai proxy and start capturing telemetry.",
      },
    ],
  }),
  component: IntegrationsPage,
});

const STEPS = [
  { id: 1, title: "Select Provider", hint: "Pick the LLM provider you want to instrument." },
  { id: 2, title: "Register API", hint: "Give us the upstream base URL and a label." },
  { id: 3, title: "Generate Proxy URL", hint: "We mint a scoped proxy endpoint and capture key." },
  { id: 4, title: "Verify Traffic", hint: "Send a test request — we confirm telemetry arrives." },
  { id: 5, title: "Start Observability", hint: "Switch your client base URL. You're live." },
];

const PROVIDERS = [
  { id: "openai", name: "OpenAI", base: "https://api.openai.com/v1", color: "#10A37F", letter: "O" },
  { id: "anthropic", name: "Anthropic", base: "https://api.anthropic.com/v1", color: "#D97757", letter: "A" },
  { id: "google", name: "Google Gemini", base: "https://generativelanguage.googleapis.com/v1", color: "#4285F4", letter: "G" },
  { id: "azure", name: "Azure OpenAI", base: "https://{resource}.openai.azure.com", color: "#0078D4", letter: "Az" },
  { id: "deepseek", name: "DeepSeek", base: "https://api.deepseek.com/v1", color: "#4D6BFE", letter: "D" },
  { id: "groq", name: "Groq", base: "https://api.groq.com/openai/v1", color: "#F55036", letter: "Gq" },
];

const CONNECTED = [
  { name: "OpenAI", color: "#10A37F", letter: "O", lastEvent: "2s ago", reqs24h: "184,210" },
  { name: "Anthropic", color: "#D97757", letter: "A", lastEvent: "11s ago", reqs24h: "82,940" },
  { name: "Google Gemini", color: "#4285F4", letter: "G", lastEvent: "4m ago", reqs24h: "12,142" },
];

function IntegrationsPage() {
  const [step, setStep] = useState(1);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [label, setLabel] = useState("production");
  const [baseUrl, setBaseUrl] = useState("");
  const [verifyState, setVerifyState] = useState<"idle" | "waiting" | "ok">("idle");

  const provider = PROVIDERS.find((p) => p.id === providerId);
  const proxyUrl = provider
    ? `https://proxy.traceai.dev/${provider.id}/${label || "default"}`
    : "";
  const proxyKey = "trace_sk_live_8af21c7e9b4c4f2a";

  const canAdvance =
    (step === 1 && !!provider) ||
    (step === 2 && !!baseUrl.trim()) ||
    (step === 3) ||
    (step === 4 && verifyState === "ok") ||
    step === 5;

  function next() {
    if (step === 4 && verifyState === "idle") {
      setVerifyState("waiting");
      setTimeout(() => setVerifyState("ok"), 1800);
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  }

  return (
    <AppShell
      title="Integrations"
      subtitle="Connect a provider. Route traffic through the TRACEai proxy. See live telemetry in under 5 minutes."
    >
      <Card className="p-0 overflow-hidden">
        {/* Stepper */}
        <ol className="grid grid-cols-1 divide-y divide-[#0F172A]/8 border-b border-[#0F172A]/8 md:grid-cols-5 md:divide-x md:divide-y-0">
          {STEPS.map((s) => {
            const state =
              step > s.id ? "done" : step === s.id ? "active" : "todo";
            return (
              <li key={s.id} className="flex items-start gap-3 p-4">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                    state === "done"
                      ? "bg-emerald-500 text-white"
                      : state === "active"
                        ? "bg-[#0F172A] text-white"
                        : "bg-[#0F172A]/[0.06] text-[#94A3B8]"
                  }`}
                >
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Step {s.id}
                  </div>
                  <div className="text-[13px] font-semibold text-[#0F172A]">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-[#64748B]">{s.hint}</div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="p-6">
          {step === 1 && (
            <div>
              <h3 className="mb-1 text-[16px] font-semibold text-[#0F172A]">
                Which provider do you want to instrument?
              </h3>
              <p className="mb-4 text-[12px] text-[#64748B]">
                TRACEai sits in front of the provider's API. Your application code does not change — only the base URL.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProviderId(p.id);
                      setBaseUrl(p.base);
                    }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      providerId === p.id
                        ? "border-[#2563EB] bg-[#2563EB]/[0.04] ring-2 ring-[#2563EB]/15"
                        : "border-[#0F172A]/10 bg-white hover:border-[#0F172A]/20"
                    }`}
                  >
                    <div
                      className="grid h-10 w-10 place-items-center rounded-lg text-[13px] font-semibold text-white"
                      style={{ background: p.color }}
                    >
                      {p.letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#0F172A]">
                        {p.name}
                      </div>
                      <div className="truncate font-mono text-[10px] text-[#94A3B8]">
                        {p.base}
                      </div>
                    </div>
                    {providerId === p.id && (
                      <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-2xl">
              <h3 className="mb-1 text-[16px] font-semibold text-[#0F172A]">
                Register the API
              </h3>
              <p className="mb-4 text-[12px] text-[#64748B]">
                Label this connection (e.g. <code className="rounded bg-[#0F172A]/[0.05] px-1 py-0.5 font-mono text-[11px]">production</code>, <code className="rounded bg-[#0F172A]/[0.05] px-1 py-0.5 font-mono text-[11px]">staging</code>) and confirm the upstream base URL we should forward to.
              </p>
              <Labeled label="Connection label">
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[13px] font-mono"
                />
              </Labeled>
              <Labeled label="Upstream base URL">
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[13px] font-mono"
                />
              </Labeled>
              <div className="mt-3 rounded-lg border border-[#0F172A]/8 bg-[#F8FAFC] p-3 text-[12px] text-[#475569]">
                Your provider API key never touches TRACEai storage. The proxy forwards your <code className="font-mono">Authorization</code> header to {provider?.name ?? "the provider"} as-is and records only telemetry.
              </div>
            </div>
          )}

          {step === 3 && provider && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h3 className="mb-1 text-[16px] font-semibold text-[#0F172A]">
                  Your proxy endpoint is ready
                </h3>
                <p className="text-[12px] text-[#64748B]">
                  Point your existing {provider.name} client at this URL. No SDK changes required.
                </p>
              </div>
              <CopyField label="Proxy base URL" value={proxyUrl} />
              <CopyField label="TRACEai capture key (header: x-trace-key)" value={proxyKey} mask />
              <div className="rounded-xl border border-[#0F172A]/8 bg-[#0B1220] p-4 font-mono text-[12px] text-[#E2E8F0]">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-[#64748B]">
                  Example — Python (openai SDK)
                </div>
                <pre className="overflow-x-auto leading-relaxed">{`from openai import OpenAI

client = OpenAI(
  base_url="${proxyUrl}",
  api_key=os.environ["OPENAI_API_KEY"],
  default_headers={"x-trace-key": "${proxyKey}"},
)`}</pre>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-2xl">
              <h3 className="mb-1 text-[16px] font-semibold text-[#0F172A]">
                Verify traffic
              </h3>
              <p className="mb-4 text-[12px] text-[#64748B]">
                Send any request through the proxy. We'll confirm telemetry has been captured and stored.
              </p>

              <div className="rounded-xl border border-[#0F172A]/8 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {verifyState === "idle" && (
                      <Circle className="h-5 w-5 text-[#94A3B8]" />
                    )}
                    {verifyState === "waiting" && (
                      <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
                    )}
                    {verifyState === "ok" && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                    <div>
                      <div className="text-[13px] font-semibold text-[#0F172A]">
                        {verifyState === "idle" && "Waiting for first request…"}
                        {verifyState === "waiting" && "Listening to proxy stream…"}
                        {verifyState === "ok" && "Telemetry captured"}
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">
                        {verifyState === "ok"
                          ? "1 request · 842 input tokens · 312 output tokens · 1,184 ms · $0.0089"
                          : "We'll auto-detect the first call within seconds of arrival."}
                      </div>
                    </div>
                  </div>
                  {verifyState === "idle" && (
                    <button
                      onClick={() => {
                        setVerifyState("waiting");
                        setTimeout(() => setVerifyState("ok"), 1800);
                      }}
                      className="rounded-lg bg-[#0F172A] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0F172A]/90"
                    >
                      Send test request
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A]">
                    Observability is live
                  </h3>
                  <p className="text-[12px] text-[#64748B]">
                    All requests routed through the proxy are now visible in Overview, Request Explorer, and feeding the Optimization Agent.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { l: "Overview", h: "Live metrics", to: "/dashboard" },
                  { l: "Request Explorer", h: "Inspect calls", to: "/logs" },
                  { l: "Optimization Agent", h: "Find savings", to: "/cost-optimizer" },
                ].map((c) => (
                  <a
                    key={c.l}
                    href={c.to}
                    className="rounded-xl border border-[#0F172A]/10 bg-white p-3 transition-colors hover:border-[#2563EB]/30"
                  >
                    <div className="text-[13px] font-semibold text-[#0F172A]">
                      {c.l}
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">{c.h}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-6 flex items-center justify-between border-t border-[#0F172A]/8 pt-4">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#475569] disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            {step < 5 && (
              <button
                onClick={next}
                disabled={!canAdvance}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-3 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#0F172A]/90"
              >
                {step === 4 && verifyState === "idle"
                  ? "Verify"
                  : "Continue"}{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Existing connections */}
      <div className="mt-6">
        <h2 className="mb-3 text-[14px] font-semibold tracking-tight text-[#0F172A]">
          Connected providers
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTED.map((c) => (
            <Card key={c.name}>
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-lg text-[13px] font-semibold text-white"
                  style={{ background: c.color }}
                >
                  {c.letter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#0F172A]">
                      {c.name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    {c.reqs24h} req / 24h · last event {c.lastEvent}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 block">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
        {label}
      </div>
      {children}
    </label>
  );
}

function CopyField({
  label,
  value,
  mask,
}: {
  label: string;
  value: string;
  mask?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!mask);
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
        {label}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-[#0F172A]/10 bg-white p-2">
        <code className="flex-1 truncate font-mono text-[12px] text-[#0F172A]">
          {revealed ? value : "•".repeat(Math.min(28, value.length))}
        </code>
        {mask && (
          <button
            onClick={() => setRevealed((r) => !r)}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-[#475569] hover:bg-[#0F172A]/[0.05]"
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
        )}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="inline-flex items-center gap-1 rounded-md bg-[#0F172A] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#0F172A]/90"
        >
          <Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
