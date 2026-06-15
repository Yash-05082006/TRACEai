import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  Plug,
  ScrollText,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/logs", label: "Request Explorer", icon: ScrollText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/cost-optimizer", label: "Optimization Agent", icon: Sparkles },
  { to: "/integrations", label: "Integrations", icon: Plug },
] as const;

const connectedProviders = [
  { name: "OpenAI", status: "live" as const, lastEvent: "2s ago" },
  { name: "Anthropic", status: "live" as const, lastEvent: "11s ago" },
  { name: "Google", status: "idle" as const, lastEvent: "4m ago" },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={180}>
      <div className="relative min-h-screen">
        {/* Background */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_60%,#F1F5F9_100%)]" />
        <div className="pointer-events-none fixed inset-0 -z-10 grid-bg opacity-40" />

        <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:px-8">
          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[220px] shrink-0 flex-col rounded-2xl border border-[#0F172A]/8 bg-white/80 backdrop-blur-xl lg:flex" style={{ padding: "0" }}>
            {/* Logo */}
            <div className="px-4 pt-5 pb-4 border-b border-[#0F172A]/6">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0F172A] text-white shadow-sm">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[14px] font-bold tracking-tight text-[#0F172A] leading-none">
                    TRACEai
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#94A3B8]">
                    LLM Observability
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <div className="px-3 py-4 flex-1 overflow-y-auto">
              <div className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
                Platform
              </div>
              <nav className="flex flex-col gap-0.5">
                {nav.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#64748B] transition-all hover:bg-[#0F172A]/[0.05] hover:text-[#0F172A]"
                    activeProps={{
                      className:
                        "bg-[#2563EB]/[0.08] text-[#2563EB] font-semibold hover:bg-[#2563EB]/[0.10] hover:text-[#2563EB]",
                    }}
                  >
                    <Icon className="h-[15px] w-[15px] shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Proxy Status Widget */}
            <div className="px-3 pb-4">
              <div className="rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] p-3">
                {/* Widget header */}
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                    Proxy status
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                </div>

                {/* Provider list */}
                <ul className="space-y-2">
                  {connectedProviders.map((p) => (
                    <li key={p.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#0F172A]">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            p.status === "live" ? "bg-emerald-500" : "bg-amber-400"
                          }`}
                        />
                        {p.name}
                      </span>
                      <span className="text-[10px] tabular-nums text-[#94A3B8]">{p.lastEvent}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to="/integrations"
                  className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                >
                  Manage providers
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Main ────────────────────────────────────────── */}
          <main className="min-w-0 flex-1">
            {/* Page header bar */}
            <div className="sticky top-0 z-20 -mx-4 mb-6 flex min-h-[60px] items-center justify-between border-b border-[#0F172A]/8 bg-white/80 px-4 py-3 backdrop-blur-xl lg:-mx-8 lg:px-8">
              <div className="min-w-0">
                <h1 className="truncate text-[20px] font-bold tracking-tight text-[#0F172A]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 truncate text-[12px] text-[#64748B]">{subtitle}</p>
                )}
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">{actions}</div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[#0F172A]/8 bg-white/80 p-5 backdrop-blur-sm soft-shadow ${className}`}
    >
      {children}
    </div>
  );
}
