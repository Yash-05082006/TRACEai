import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { InfoTooltip } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { applicationsApi, Application, ApplicationEndpoint } from "@/lib/api";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Terminal,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "TRACEAI | Applications" },
      { name: "description", content: "Manage your AI applications and trace endpoints." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.list,
  });

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return (
      <AppShell title="Applications" subtitle="Loading your applications...">
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
        </div>
      </AppShell>
    );
  }

  const apps = applications || [];

  if (isCreating || (apps.length === 0 && !selectedAppId)) {
    return <CreateApplicationView onBack={() => setIsCreating(false)} onCreated={(id) => { setSelectedAppId(id); setIsCreating(false); }} showBack={apps.length > 0} />;
  }

  if (selectedAppId) {
    const app = apps.find((a) => a.id === selectedAppId);
    if (app) return <ApplicationDetailView application={app} onBack={() => setSelectedAppId(null)} />;
  }

  return (
    <AppShell
      title="Applications"
      subtitle="Manage your connected LLM applications and telemetry endpoints."
    >
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">All Applications</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0F172A]/90"
        >
          <Plus className="h-4 w-4" /> New Application
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <Card
            key={app.id}
            className="p-5 cursor-pointer hover:border-[#2563EB]/40 transition-colors group"
            onClick={() => setSelectedAppId(app.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0F172A]">{app.application_name}</h3>
              </div>
              <ChevronRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" />
            </div>
            <div className="text-[12px] text-[#64748B] mb-4 line-clamp-2 min-h-[36px]">
              {app.description || "No description provided."}
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              <div>
                <span className="text-[#0F172A]">{app.endpoints?.length || 0}</span> Endpoints
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function CreateApplicationView({ onBack, onCreated, showBack }: { onBack: () => void; onCreated: (id: string) => void; showBack: boolean }) {
  const queryClient = useQueryClient();
  const [appName, setAppName] = useState("AiGENTThix Assistant");
  const [appBaseUrl, setAppBaseUrl] = useState("https://aigenthix.com");
  const [appDesc, setAppDesc] = useState("AI Website Assistant");

  const createMutation = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      onCreated(data.id);
    },
    onError: (err) => {
      alert(`Failed to create application: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  return (
    <AppShell title="Create Application" subtitle="Define the top-level application that will group your endpoints.">
      {showBack && (
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A]">
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </button>
      )}
      <Card className="max-w-2xl p-6">
        <div className="space-y-4">
          <label className="block">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Application Name</div>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[13px] focus:border-[#2563EB] focus:outline-none"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Base URL (Optional)</div>
            <input
              value={appBaseUrl}
              onChange={(e) => setAppBaseUrl(e.target.value)}
              className="w-full rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[13px] font-mono focus:border-[#2563EB] focus:outline-none"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Description (Optional)</div>
            <textarea
              value={appDesc}
              onChange={(e) => setAppDesc(e.target.value)}
              className="w-full rounded-lg border border-[#0F172A]/10 bg-white px-3 py-2 text-[13px] focus:border-[#2563EB] focus:outline-none min-h-[80px]"
            />
          </label>
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => createMutation.mutate({ application_name: appName, base_url: appBaseUrl, description: appDesc, provider: "openrouter" })}
              disabled={createMutation.isPending || !appName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#2563EB]/90 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Application <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

function ApplicationDetailView({ application, onBack }: { application: Application; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);
  const [lang, setLang] = useState<"python" | "node">("python");

  return (
    <AppShell title={application.application_name} subtitle={application.description || "Application Details"}>
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A]">
        <ArrowLeft className="h-4 w-4" /> Back to Applications
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[16px] font-semibold text-[#0F172A]">Endpoints</h3>
              <button
                onClick={() => setIsAddingEndpoint(true)}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                <Plus className="h-4 w-4" /> Add Endpoint
              </button>
            </div>

            {isAddingEndpoint && (
              <EndpointForm
                appId={application.id}
                onCancel={() => setIsAddingEndpoint(false)}
                onSuccess={() => { setIsAddingEndpoint(false); queryClient.invalidateQueries({ queryKey: ["applications"] }); }}
              />
            )}

            <div className="mt-4 space-y-3">
              {!application.endpoints?.length && !isAddingEndpoint && (
                <div className="p-6 text-center text-[#64748B] text-[13px] border border-dashed border-[#0F172A]/10 rounded-xl">
                  No endpoints registered yet. Add one to start tracking telemetry.
                </div>
              )}
              {application.endpoints?.map((ep) => (
                <div key={ep.id} className="p-4 border border-[#0F172A]/10 rounded-xl bg-[#F8FAFC]">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-[#0F172A]">{ep.endpoint_name}</div>
                      <div className="text-[12px] font-mono text-[#64748B] mt-1">{ep.endpoint_path}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Feature</div>
                      <div className="text-[12px] font-semibold text-[#2563EB]">{ep.feature || "N/A"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-[#0F172A]/10 bg-[#F8FAFC]">
              <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">Integration Instructions</h3>
              <p className="text-[13px] text-[#64748B]">
                Route your LLM SDK traffic through our proxy using these credentials.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <CopyField label="Generated Proxy URL" value={application.proxy_url || "http://127.0.0.1:8004/proxy/v1"} />
                <CopyField label="TRACEai Capture Key" value={application.trace_key} mask />
              </div>
            </div>
            <div className="flex border-b border-[#0F172A]/8 bg-white">
              <button
                onClick={() => setLang("python")}
                className={\`px-4 py-2 text-[12px] font-semibold \${lang === "python" ? "border-b-2 border-[#2563EB] text-[#2563EB]" : "text-[#64748B] hover:text-[#0F172A]"}\`}
              >
                Python
              </button>
              <button
                onClick={() => setLang("node")}
                className={\`px-4 py-2 text-[12px] font-semibold \${lang === "node" ? "border-b-2 border-[#2563EB] text-[#2563EB]" : "text-[#64748B] hover:text-[#0F172A]"}\`}
              >
                Node.js
              </button>
            </div>
            <div className="bg-[#0B1220] p-4 font-mono text-[13px] text-[#E2E8F0] overflow-x-auto leading-loose">
              {lang === "python" ? (
                <pre>{\`from openai import OpenAI\n\nclient = OpenAI(\n    base_url="\${application.proxy_url || 'http://127.0.0.1:8004/proxy/v1'}",\n    api_key=os.environ.get("OPENAI_API_KEY"),\n    default_headers={\n        "x-trace-key": "\${application.trace_key}",\n        "x-trace-endpoint": "\${application.endpoints?.[0]?.endpoint_path || '/chat'}",\n        "x-trace-feature": "\${application.endpoints?.[0]?.feature || 'Website Assistant'}"\n    }\n)\n\nresponse = client.chat.completions.create(...)\`}</pre>
              ) : (
                <pre>{\`import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  baseURL: '\${application.proxy_url || 'http://127.0.0.1:8004/proxy/v1'}',\n  apiKey: process.env.OPENAI_API_KEY,\n  defaultHeaders: { \n    'x-trace-key': '\${application.trace_key}',\n    'x-trace-endpoint': '\${application.endpoints?.[0]?.endpoint_path || '/chat'}',\n    'x-trace-feature': '\${application.endpoints?.[0]?.feature || 'Website Assistant'}'\n  }\n});\n\nconst response = await client.chat.completions.create(...);\`}</pre>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-[#0F172A] text-white">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <h3 className="text-[15px] font-semibold">Active Listening</h3>
            </div>
            <p className="text-[13px] text-[#94A3B8] mb-4">
              Your application is ready to receive telemetry. Make a request via the proxy to see it appear in the Request Explorer.
            </p>
            <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Awaiting traffic...
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function EndpointForm({ appId, onCancel, onSuccess }: { appId: string; onCancel: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("Website Chat");
  const [path, setPath] = useState("/chat");
  const [feature, setFeature] = useState("Website Assistant");
  const [method, setMethod] = useState("POST");
  const [desc, setDesc] = useState("Customer-facing AI chat");

  const mutation = useMutation({
    mutationFn: (data: any) => applicationsApi.createEndpoint(appId, data),
    onSuccess,
    onError: (err) => alert(\`Failed: \${err}\`),
  });

  return (
    <div className="mb-6 p-5 border border-[#2563EB]/20 bg-blue-50/30 rounded-xl">
      <h4 className="text-[13px] font-semibold text-[#0F172A] mb-4">New Endpoint</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="block">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Endpoint Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-[#0F172A]/10 px-3 py-2 text-[12px]" />
        </label>
        <label className="block">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Endpoint Path</div>
          <input value={path} onChange={(e) => setPath(e.target.value)} className="w-full rounded-lg border border-[#0F172A]/10 px-3 py-2 text-[12px] font-mono" />
        </label>
        <label className="block">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Feature</div>
          <input value={feature} onChange={(e) => setFeature(e.target.value)} className="w-full rounded-lg border border-[#0F172A]/10 px-3 py-2 text-[12px]" />
        </label>
        <label className="block">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Method</div>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-lg border border-[#0F172A]/10 px-3 py-2 text-[12px]">
            <option>POST</option><option>GET</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[12px] font-medium text-[#64748B]">Cancel</button>
        <button
          onClick={() => mutation.mutate({ endpoint_name: name, endpoint_path: path, request_method: method, feature, description: desc })}
          disabled={mutation.isPending}
          className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          {mutation.isPending ? "Saving..." : "Save Endpoint"}
        </button>
      </div>
    </div>
  );
}

function CopyField({ label, value, mask }: { label: string; value: string; mask?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!mask);
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">{label}</div>
      <div className="flex items-center gap-2 rounded-lg border border-[#0F172A]/10 bg-white p-2">
        <code className="flex-1 truncate font-mono text-[12px] text-[#0F172A]">
          {revealed ? value : "•".repeat(Math.min(28, value.length))}
        </code>
        {mask && <button onClick={() => setRevealed(r => !r)} className="px-2 py-1 text-[11px] font-medium text-[#475569]"> {revealed ? "Hide" : "Reveal"} </button>}
        <button
          onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
          className="inline-flex items-center gap-1 rounded-md bg-[#0F172A] px-2 py-1 text-[11px] font-medium text-white"
        >
          <Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
