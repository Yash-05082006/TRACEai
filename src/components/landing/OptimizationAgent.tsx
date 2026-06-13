import { motion } from "framer-motion";
import { Sparkles, ArrowRight, TrendingDown, Database, Scissors, Layers } from "lucide-react";
import { SectionHeader } from "./Features";

const recs = [
  {
    icon: Layers,
    title: "Switch 80% of requests to GPT-4o-mini",
    detail: "For summarization and classification routes. Quality delta -0.4% across 2,400 evals.",
    savings: "$4,820",
    impact: "high",
  },
  {
    icon: Database,
    title: "Enable semantic caching",
    detail: "62% of /search prompts are near-duplicates within a 24h window. Cache hit projection: 71%.",
    savings: "$2,140",
    impact: "high",
  },
  {
    icon: Scissors,
    title: "Reduce average context size by 38%",
    detail: "Trim retrieved chunks above relevance 0.81 threshold. No measurable quality regression.",
    savings: "$1,680",
    impact: "medium",
  },
  {
    icon: TrendingDown,
    title: "Limit output tokens on /draft endpoint",
    detail: "P95 output is 412 tokens; mean useful output is 180. Cap at 256 to reclaim spend.",
    savings: "$780",
    impact: "medium",
  },
];

export function OptimizationAgent() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Optimization agent"
          title="Recommendations that pay for themselves"
          desc="An autonomous agent evaluates your traffic against thousands of policy templates and proposes the changes with the highest projected ROI."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-5">
          {/* Left summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-2"
          >
            <div className="relative overflow-hidden rounded-3xl border border-[#0F172A]/8 bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-8 text-white lift-shadow">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2563EB]/40 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#10B981]/20 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#0EA5E9]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    This month
                  </span>
                </div>
                <div className="mt-6">
                  <div className="text-[14px] text-white/60">Projected savings</div>
                  <div className="mt-1 text-[64px] font-semibold leading-none tracking-tight">
                    $9,420
                    <span className="ml-1 text-[20px] text-white/40">/mo</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Bar label="Compute cost" before={24851} after={15431} />
                  <Bar label="Average latency" before={612} after={412} unit="ms" />
                  <Bar label="Quality score" before={9.1} after={9.1} unit="" same />
                </div>

                <button className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-semibold text-[#0F172A] transition-transform hover:scale-[1.02]">
                  Review all 12 recommendations
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          <div className="space-y-3 lg:col-span-3">
            {recs.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ x: 4 }}
                className="group relative flex items-start gap-4 rounded-2xl border border-[#0F172A]/8 bg-white p-5 transition-all hover:soft-shadow"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#2563EB]/8 text-[#2563EB]">
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-semibold text-[#0F172A]">{r.title}</h4>
                    {r.impact === "high" && (
                      <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
                        High impact
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">{r.detail}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Saves
                  </div>
                  <div className="text-[18px] font-semibold text-[#10B981]">{r.savings}</div>
                  <div className="text-[10px] text-[#94A3B8]">/ month</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Bar({
  label,
  before,
  after,
  unit = "",
  same,
}: {
  label: string;
  before: number;
  after: number;
  unit?: string;
  same?: boolean;
}) {
  const pct = same ? 100 : (after / before) * 100;
  const isMoney = !unit;
  const fmt = (n: number) => (isMoney ? `$${n.toLocaleString()}` : `${n}${unit}`);
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-white/60">{label}</span>
        <span className="font-medium">
          <span className="text-white/40 line-through">{fmt(before)}</span>{" "}
          <span className={same ? "text-white" : "text-[#10B981]"}>→ {fmt(after)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: "100%" }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981]"
        />
      </div>
    </div>
  );
}
