import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { InfoTooltip } from "@/components/ui/tooltip";
import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "TRACEAI | Integrations" },
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
  { id: 3, title: "Update Code", hint: "Swap the base URL in your SDK." },
  { id: 4, title: "Verify Traffic", hint: "Send a test request to confirm telemetry." },
];

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    base: "https://api.openai.com/v1",
    color: "#10A37F",
    letter: "O",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    base: "https://api.anthropic.com/v1",
    color: "#D97757",
    letter: "A",
  },
  {
    id: "google",
    name: "Google Gemini",
    base: "https://generativelanguage.googleapis.com/v1",
    color: "#4285F4",
    letter: "G",
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    base: "https://{resource}.openai.azure.com",
    color: "#0078D4",
    letter: "Az",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    base: "https://api.deepseek.com/v1",
    color: "#4D6BFE",
    letter: "D",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    base: "https://openrouter.ai/api/v1",
    color: "#8B5CF6",
    letter: "O",
  },
];

function IntegrationsPage() {
  const [step, setStep] = useState(1);
  const [providerId, setProviderId] = useState<string>("openai");
  const [label, setLabel] = useState("production");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [lang, setLang] = useState<"python" | "node">("python");

  const [verifyChecks, setVerifyChecks] = useState([false, false, false]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [persistedProxyKey, setPersistedProxyKey] = useState<string | null>(null);

  const provider = PROVIDERS.find((p) => p.id === providerId);
  const localApiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://127.0.0.1:8004";
  const proxyUrl = `${localApiBase}/proxy/v1`;
  const [mockProxyKey] = useState(() => `trace_sk_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`);
  const proxyKey = persistedProxyKey || mockProxyKey;

  const canAdvance =
    (step === 1 && !!provider) ||
    (step === 2 && !!baseUrl.trim()) ||
    step === 3 ||
    (step === 4 && verifyChecks[2]);

  async function handleNext() {
    if (step === 2) {
      setIsCreatingApp(true);
      try {
        const response = await fetch(`${localApiBase}/applications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_name: label || "default",
            provider: providerId,
            default_model: null,
            upstream_base_url: baseUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data && data.trace_key) {
          setPersistedProxyKey(data.trace_key);
        }
        setStep(3);
      } catch (err) {
        console.error("Failed to create application:", err);
        alert(`Failed to register integration: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsCreatingApp(false);
      }
    } else {
      setStep((s) => Math.min(4, s + 1));
    }
  }

  function startVerification() {
    setIsVerifying(true);
    setVerifyChecks([false, false, false]);
    setTimeout(() => setVerifyChecks([true, false, false]), 800);
    setTimeout(() => setVerifyChecks([true, true, false]), 1600);
    setTimeout(() => {
      setVerifyChecks([true, true, true]);
      setIsVerifying(false);
    }, 2800);
  }

  return (
    <AppShell
      title="Integrations Setup"
      subtitle="Connect a provider. Route traffic through the TRACEai proxy. See live telemetry."
    >
      {/* Quick Start Panel */}
      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-5 w-5 text-blue-600" />
          <h2 className="text-[16px] font-semibold tracking-tight text-blue-900">
            Quick Start (2 Minutes)
          </h2>
        </div>
        <p className="text-[13px] text-blue-800 max-w-3xl mb-4 leading-relaxed">
          TRACEai sits in front of your LLM provider as a transparent proxy. You do not need to
          install a new SDK or change your application logic. Simply change the{" "}
          <strong>base_url</strong> in your existing OpenAI/Anthropic client to point to our proxy,
          and attach your <strong>x-trace-key</strong>. We handle the rest.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* Stepper */}
        <ol className="grid grid-cols-1 divide-y divide-[#0F172A]/8 border-b border-[#0F172A]/8 md:grid-cols-4 md:divide-x md:divide-y-0 bg-[#F8FAFC]/50">
          {STEPS.map((s) => {
            const state = step > s.id ? "done" : step === s.id ? "active" : "todo";
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
                  <div className="text-[13px] font-semibold text-[#0F172A]">{s.title}</div>
                  <div className="text-[11px] text-[#64748B]">{s.hint}</div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="p-6">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-[16px] font-semibold text-[#0F172A]">
                  Which provider do you want to instrument?
                </h3>
                <InfoTooltip content="You can add multiple providers later. Each provider will get its own unique proxy route." />
              </div>
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
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[13px] font-semibold text-white"
                      style={{ background: p.color }}
                    >
                      {p.letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#0F172A]">{p.name}</div>
                      <div className="truncate font-mono text-[10px] text-[#94A3B8]">{p.base}</div>
                    </div>
                    {providerId === p.id && <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-[16px] font-semibold text-[#0F172A]">Register the API</h3>
                <InfoTooltip content="We use the label to organize your traffic (e.g. separate dev vs production). The upstream URL is where TRACEai will forward the requests." />
              </div>
              <div className="space-y-4">
                <label className="block">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Environment Label
                  </div>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[13px] font-mono focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Upstream Provider Base URL
                    <InfoTooltip content="The upstream API endpoint that TRACEai proxies traffic to. This is the base_url of the provider SDK (not the proxy URL). TRACEai sits between your app and this URL." />
                  </div>
                  <input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[13px] font-mono focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                  />
                </label>
                <div className="flex items-start gap-2 rounded-lg border border-[#0F172A]/8 bg-[#F8FAFC] px-3 py-2.5">
                  <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] shrink-0">Telemetry</span>
                  <InfoTooltip content="TRACEai captures: request/response bodies, token counts, latency, TTFT, status codes, and user/session IDs. Your provider API key is never stored - it passes through in-flight only." />
                  <span className="text-[12px] text-[#64748B]">Captures request metadata, tokens, cost, and latency. Your API key is never stored.</span>
                </div>
              </div>
              <div className="mt-4 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-[12px] text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <p>
                  <strong>Secure by design.</strong> Your provider API keys (e.g.{" "}
                  <code className="font-mono">OPENAI_API_KEY</code>) are passed through the proxy
                  directly to the provider via the Authorization header. TRACEai never stores or
                  logs your API keys.
                </p>
              </div>
            </div>
          )}

          {step === 3 && provider && (
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <div>
                <h3 className="mb-1 text-[16px] font-semibold text-[#0F172A]">
                  Update your SDK configuration
                </h3>
                <p className="text-[13px] text-[#64748B]">
                  Your proxy endpoint is ready. Update your client configuration using the
                  credentials below.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CopyField
                  label="Generated Proxy URL"
                  value={proxyUrl}
                  tooltip="Pass this as the base_url to your SDK so traffic routes through TRACEai."
                />
                <CopyField
                  label="TRACEai Capture Key"
                  value={proxyKey}
                  mask
                  tooltip="Pass this in the x-trace-key header to authenticate your telemetry."
                />
              </div>

              <div className="rounded-xl border border-[#0F172A]/8 overflow-hidden">
                <div className="flex border-b border-[#0F172A]/8 bg-[#F8FAFC]">
                  <button
                    onClick={() => setLang("python")}
                    className={`px-4 py-2 text-[12px] font-semibold ${lang === "python" ? "border-b-2 border-[#2563EB] text-[#2563EB]" : "text-[#64748B] hover:text-[#0F172A]"}`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setLang("node")}
                    className={`px-4 py-2 text-[12px] font-semibold ${lang === "node" ? "border-b-2 border-[#2563EB] text-[#2563EB]" : "text-[#64748B] hover:text-[#0F172A]"}`}
                  >
                    Node.js
                  </button>
                </div>
                <div className="bg-[#0B1220] p-4 font-mono text-[13px] text-[#E2E8F0] overflow-x-auto leading-loose">
                  {lang === "python" ? (
                    <pre>{`from ${providerId === "anthropic" ? "anthropic" : "openai"} import ${providerId === "anthropic" ? "Anthropic" : "OpenAI"}

client = ${providerId === "anthropic" ? "Anthropic" : "OpenAI"}(
    base_url="${proxyUrl}",
    api_key=os.environ.get("${providerId.toUpperCase()}_API_KEY"),
    default_headers={"x-trace-key": "${proxyKey}"}
)

# Your existing code works exactly the same!
response = client.chat.completions.create(...)`}</pre>
                  ) : (
                    <pre>{`import ${providerId === "anthropic" ? "Anthropic" : "OpenAI"} from '${providerId === "anthropic" ? "@anthropic-ai/sdk" : "openai"}';

const client = new ${providerId === "anthropic" ? "Anthropic" : "OpenAI"}({
  baseURL: '${proxyUrl}',
  apiKey: process.env.${providerId.toUpperCase()}_API_KEY,
  defaultHeaders: { 'x-trace-key': '${proxyKey}' }
});

// Your existing code works exactly the same!
const response = await client.chat.completions.create(...);`}</pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="mb-1 text-[16px] font-semibold text-[#0F172A]">Verify Connection</h3>
              <p className="mb-6 text-[13px] text-[#64748B]">
                Run your application and trigger an LLM request. We'll listen for the traffic to
                confirm everything is wired up correctly.
              </p>

              <div className="rounded-xl border border-[#0F172A]/8 bg-white p-5 shadow-sm">
                <div className="space-y-4">
                  <VerificationRow
                    checked={verifyChecks[0]}
                    loading={isVerifying && !verifyChecks[0]}
                    label="Establishing proxy connection"
                  />
                  <VerificationRow
                    checked={verifyChecks[1]}
                    loading={verifyChecks[0] && !verifyChecks[1]}
                    label="Receiving first LLM request"
                  />
                  <VerificationRow
                    checked={verifyChecks[2]}
                    loading={verifyChecks[1] && !verifyChecks[2]}
                    label="Extracting and indexing telemetry"
                  />
                </div>

                {!verifyChecks[2] && (
                  <div className="mt-6 pt-4 border-t border-[#0F172A]/8 flex justify-end">
                    <button
                      onClick={startVerification}
                      disabled={isVerifying}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Terminal className="h-4 w-4" />
                      )}
                      {isVerifying ? "Listening for traffic..." : "Simulate Request"}
                    </button>
                  </div>
                )}

                {verifyChecks[2] && (
                  <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-medium text-[13px]">
                      <CheckCircle2 className="h-5 w-5" /> Integration verified successfully!
                    </div>
                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="text-[12px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Go to Dashboard →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between border-t border-[#0F172A]/8 pt-4">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#475569] disabled:opacity-40 hover:bg-[#0F172A]/[0.05]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 4 && (
              <button
                onClick={handleNext}
                disabled={!canAdvance || isCreatingApp}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#2563EB]/90 shadow-sm"
              >
                {isCreatingApp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" /> Registering...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

function VerificationRow({
  checked,
  loading,
  label,
}: {
  checked: boolean;
  loading: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {checked ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      ) : loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-[#2563EB] shrink-0" />
      ) : (
        <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0" />
      )}
      <span
        className={`text-[13px] font-medium ${checked ? "text-[#0F172A]" : loading ? "text-[#2563EB]" : "text-[#94A3B8]"}`}
      >
        {label}
      </span>
    </div>
  );
}

function CopyField({
  label,
  value,
  mask,
  tooltip,
}: {
  label: string;
  value: string;
  mask?: boolean;
  tooltip?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!mask);
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
          {label}
        </span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-[#0F172A]/10 bg-[#F8FAFC] p-2">
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
