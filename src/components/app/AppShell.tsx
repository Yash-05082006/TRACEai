import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  Plug,
  ScrollText,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/logs", label: "Request Explorer", icon: ScrollText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/cost-optimizer", label: "Optimization Agent", icon: Sparkles },
  { to: "/integrations", label: "Integrations", icon: Plug },
] as const;

// Mock connected providers — drives the sidebar status block
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
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_60%,#F1F5F9_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 grid-bg opacity-40" />

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl border border-[#0F172A]/8 bg-white/70 p-4 backdrop-blur-xl lg:flex">
          <Link to="/" className="mb-6 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0F172A] text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[14px] font-semibold tracking-tight text-[#0F172A]">
                TRACEai
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#94A3B8]">
                LLM Observability
              </div>
            </div>
          </Link>

          <nav className="flex flex-col gap-0.5">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#475569] transition-colors hover:bg-[#0F172A]/[0.05] hover:text-[#0F172A]"
                activeProps={{
                  className:
                    "bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/10 hover:text-[#2563EB]",
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Provider connection status */}
          <div className="mt-auto rounded-xl border border-[#0F172A]/8 bg-white/80 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Proxy status
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                <span className="relative grid h-1.5 w-1.5 place-items-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Receiving traffic
              </span>
            </div>
            <ul className="space-y-1.5">
              {connectedProviders.map((p) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between text-[12px]"
                >
                  <span className="flex items-center gap-2 text-[#0F172A]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${p.status === "live" ? "bg-emerald-500" : "bg-amber-400"}`}
                    />
                    {p.name}
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    {p.lastEvent}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/integrations"
              className="mt-3 inline-block text-[11px] font-semibold text-[#2563EB] hover:underline"
            >
              Manage providers →
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center justify-between border-b border-[#0F172A]/8 bg-white/70 px-4 py-4 backdrop-blur-xl lg:-mx-8 lg:px-8">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-[#0F172A]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-[13px] text-[#64748B]">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#0F172A]/8 bg-white/80 p-5 backdrop-blur-sm soft-shadow ${className}`}
    >
      {children}
    </div>
  );
}
