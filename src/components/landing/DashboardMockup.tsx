import { motion } from "framer-motion";
import {
  TrendingDown,
  Zap,
  DollarSign,
  Activity,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
} from "lucide-react";

// A bespoke, layered dashboard composition. Not a screenshot.
export function DashboardMockup() {
  return (
    <div className="relative">
      {/* Halo */}
      <div className="absolute -inset-10 -z-10 rounded-[40px] bg-gradient-to-br from-[#2563EB]/15 via-[#0EA5E9]/10 to-transparent blur-3xl" />

      {/* Main frame */}
      <div className="relative rounded-[28px] border border-[#0F172A]/8 bg-white/70 p-3 backdrop-blur-xl lift-shadow">
        <div className="rounded-[20px] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-5">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-[#0F172A]/6 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]/70" />
              </div>
              <span className="ml-3 text-[12px] font-medium text-[#475569]">
                techies.io / dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#10B981]/10 px-2.5 py-1 text-[11px] font-medium text-[#10B981]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#10B981]/60" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                </span>
                Live
              </span>
              <span className="text-[11px] text-[#94A3B8]">Last 24h</span>
            </div>
          </div>

          {/* Grid */}
          <div className="mt-5 grid grid-cols-12 gap-4">
            {/* Stat cards */}
            <StatCard
              className="col-span-3"
              label="Total Spend"
              value="$24,851"
              delta="-18.2%"
              trend="down"
              icon={<DollarSign className="h-3.5 w-3.5" />}
            />
            <StatCard
              className="col-span-3"
              label="Tokens / day"
              value="184.2M"
              delta="+4.1%"
              trend="up"
              icon={<Zap className="h-3.5 w-3.5" />}
            />
            <StatCard
              className="col-span-3"
              label="P95 Latency"
              value="412ms"
              delta="-22ms"
              trend="down"
              icon={<Activity className="h-3.5 w-3.5" />}
            />
            <StatCard
              className="col-span-3"
              label="Requests"
              value="1.24M"
              delta="+9.6%"
              trend="up"
              icon={<Cpu className="h-3.5 w-3.5" />}
            />

            {/* Cost chart */}
            <div className="col-span-8 rounded-2xl border border-[#0F172A]/6 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                    Cost over time
                  </div>
                  <div className="mt-1 text-[20px] font-semibold tracking-tight text-[#0F172A]">
                    $24,851.32
                  </div>
                </div>
                <div className="flex gap-1 rounded-lg bg-[#F1F5F9] p-1 text-[11px] font-medium">
                  {["24h", "7d", "30d", "90d"].map((t, i) => (
                    <button
                      key={t}
                      className={`rounded-md px-2.5 py-1 ${
                        i === 1 ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <AreaChart />
              <div className="mt-3 flex items-center justify-between text-[10px] text-[#94A3B8]">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>

            {/* Model breakdown */}
            <div className="col-span-4 rounded-2xl border border-[#0F172A]/6 bg-white p-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                Model usage
              </div>
              <div className="mt-3 space-y-3">
                <ModelRow name="GPT-4o" pct={48} color="#2563EB" cost="$11,920" />
                <ModelRow name="GPT-4o-mini" pct={29} color="#0EA5E9" cost="$2,148" />
                <ModelRow name="Claude 3.5" pct={15} color="#10B981" cost="$6,521" />
                <ModelRow name="Gemini 1.5" pct={8} color="#F59E0B" cost="$4,262" />
              </div>
            </div>

            {/* Recommendation */}
            <div className="col-span-7 rounded-2xl border border-[#2563EB]/15 bg-gradient-to-br from-[#2563EB]/5 via-white to-white p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0F172A] text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB]">
                      Agent recommendation
                    </span>
                    <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-semibold text-[#10B981]">
                      Save $4,820/mo
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-[15px] font-semibold text-[#0F172A]">
                    Route 80% of summarization to GPT-4o-mini
                  </h4>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#64748B]">
                    Quality delta across 2,400 evaluated traces: -0.4%. Estimated monthly
                    savings $4,820 with no measurable latency regression.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-lg bg-[#0F172A] px-3 py-1.5 text-[11px] font-semibold text-white">
                      Apply policy
                    </button>
                    <button className="rounded-lg border border-[#0F172A]/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#0F172A]">
                      Inspect traces
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Latency */}
            <div className="col-span-5 rounded-2xl border border-[#0F172A]/6 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                    Latency distribution
                  </div>
                  <div className="mt-1 text-[20px] font-semibold tracking-tight text-[#0F172A]">
                    412<span className="text-[14px] font-normal text-[#94A3B8]"> ms p95</span>
                  </div>
                </div>
                <TrendingDown className="h-4 w-4 text-[#10B981]" />
              </div>
              <Bars />
            </div>
          </div>
        </div>
      </div>

      {/* Floating side cards */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-6 top-24 hidden w-56 rounded-2xl border border-[#0F172A]/8 bg-white/90 p-4 backdrop-blur-xl lift-shadow lg:block"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Anomaly detected
          </span>
          <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
        </div>
        <div className="mt-2 text-[13px] font-semibold text-[#0F172A]">
          /chat endpoint spend ↑ 312%
        </div>
        <div className="mt-1 text-[11px] text-[#64748B]">
          Runaway loop in onboarding-agent v2.1
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#EF4444] to-[#F59E0B]"
            initial={{ width: 0 }}
            animate={{ width: "78%" }}
            transition={{ duration: 1.5, delay: 1.4 }}
          />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-6 bottom-24 hidden w-60 rounded-2xl border border-[#0F172A]/8 bg-white/90 p-4 backdrop-blur-xl lift-shadow lg:block"
      >
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#10B981]/10 text-[#10B981]">
            <TrendingDown className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Caching enabled
          </span>
        </div>
        <div className="mt-2 text-[13px] font-semibold text-[#0F172A]">
          Saved $1,284 today
        </div>
        <div className="mt-3 grid grid-cols-7 items-end gap-1 h-10">
          {[40, 55, 38, 70, 48, 82, 64].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.8, delay: 1.2 + i * 0.05 }}
              className="rounded-sm bg-gradient-to-t from-[#2563EB] to-[#0EA5E9]"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  className,
  label,
  value,
  delta,
  trend,
  icon,
}: {
  className?: string;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}) {
  const good = trend === "down" && label.includes("Spend") || trend === "down" && label.includes("Latency") || (trend === "up" && (label.includes("Tokens") || label.includes("Requests")));
  return (
    <div className={`${className} group rounded-2xl border border-[#0F172A]/6 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
          {label}
        </span>
        <span className="grid h-6 w-6 place-items-center rounded-md bg-[#F1F5F9] text-[#64748B]">
          {icon}
        </span>
      </div>
      <div className="mt-2 text-[22px] font-semibold tracking-tight text-[#0F172A]">
        {value}
      </div>
      <div className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${good ? "text-[#10B981]" : "text-[#EF4444]"}`}>
        {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {delta}
        <span className="text-[#94A3B8] font-normal">vs last week</span>
      </div>
    </div>
  );
}

function ModelRow({ name, pct, color, cost }: { name: string; pct: number; color: string; cost: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="font-medium text-[#0F172A]">{name}</span>
        </div>
        <span className="text-[#64748B]">{cost}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        />
      </div>
    </div>
  );
}

function AreaChart() {
  return (
    <div className="relative mt-4 h-36">
      <svg viewBox="0 0 400 140" className="h-full w-full">
        <defs>
          <linearGradient id="aChart" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2="400" y1={i * 35 + 10} y2={i * 35 + 10} stroke="#0F172A" strokeOpacity="0.05" />
        ))}
        <motion.path
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          d="M0,100 C40,80 70,90 110,70 C150,50 180,75 220,55 C260,38 300,60 340,40 C370,28 390,38 400,30"
          fill="none"
          stroke="#2563EB"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <motion.path
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1 }}
          d="M0,100 C40,80 70,90 110,70 C150,50 180,75 220,55 C260,38 300,60 340,40 C370,28 390,38 400,30 L400,140 L0,140 Z"
          fill="url(#aChart)"
        />
        {/* Secondary line */}
        <motion.path
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
          d="M0,115 C40,108 70,112 110,98 C150,90 180,100 220,88 C260,80 300,90 340,78 C370,70 390,76 400,72"
          fill="none"
          stroke="#0EA5E9"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
}

function Bars() {
  const data = [22, 30, 48, 62, 78, 90, 72, 58, 44, 32, 22, 14];
  return (
    <div className="mt-4 flex h-28 items-end gap-1.5">
      {data.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-[#2563EB]/80 to-[#0EA5E9]"
        />
      ))}
    </div>
  );
}
