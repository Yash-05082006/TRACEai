import { motion } from "framer-motion";
import { Plug, Radio, BarChart3, Wand2 } from "lucide-react";
import { SectionHeader } from "./Features";

const steps = [
  {
    icon: Plug,
    title: "Connect AI Application",
    desc: "Drop in one SDK line, configure a proxy, or stream OTel traces. Live in under 4 minutes.",
    code: "techies.init({ project: 'prod' })",
  },
  {
    icon: Radio,
    title: "Monitor AI Requests",
    desc: "Every request, response, tool call, and embedding is captured with model, cost, and latency context.",
    code: "1,248,491 events / hour",
  },
  {
    icon: BarChart3,
    title: "Analyze Usage Data",
    desc: "Slice by environment, customer, feature, model, or prompt template. Pin anything to a shared dashboard.",
    code: "GROUP BY feature, model",
  },
  {
    icon: Wand2,
    title: "Generate Optimization Insights",
    desc: "The agent proposes routing, caching, and prompt-compression changes with evaluated quality deltas.",
    code: "+$4,820 / month projected",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="How it works"
          title="From signal to savings in four steps"
          desc="A connected flow designed for engineering teams, finance teams, and the agents in between."
        />

        <div className="relative mt-20">
          {/* Connector line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#0F172A]/10 to-transparent lg:block" />

          <div className="space-y-12 lg:space-y-24">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`grid items-center gap-8 lg:grid-cols-2 ${
                  i % 2 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Text */}
                <div className={i % 2 ? "lg:pl-16" : "lg:pr-16"}>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-[#0F172A]/10 bg-white px-3 py-1 text-[11px] font-bold tracking-wider text-[#2563EB]">
                      STEP 0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[32px] font-semibold tracking-tight text-[#0F172A]">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-[#64748B]">
                    {s.desc}
                  </p>
                </div>

                {/* Card */}
                <div className="relative">
                  <div
                    className="absolute -inset-8 -z-10 rounded-[40px] opacity-50 blur-3xl"
                    style={{ background: "radial-gradient(closest-side, rgba(37,99,235,0.18), transparent 70%)" }}
                  />
                  <div className="relative rounded-3xl border border-[#0F172A]/8 bg-white/80 p-6 backdrop-blur-xl soft-shadow">
                    <div className="flex items-center justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0F172A] text-white">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        Live
                      </span>
                    </div>
                    <div className="mt-6 rounded-xl bg-[#0F172A] p-4 font-mono text-[12px] text-white/90">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#EF4444]/60" />
                        <span className="h-2 w-2 rounded-full bg-[#F59E0B]/60" />
                        <span className="h-2 w-2 rounded-full bg-[#10B981]/60" />
                      </div>
                      <div className="mt-3 text-[#0EA5E9]">{`> ${s.code}`}</div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: [0, 1, 0, 1] }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="mt-1 inline-block h-3 w-2 bg-white/70"
                      />
                    </div>
                    {/* Mini bars */}
                    <div className="mt-4 flex items-end gap-1 h-12">
                      {[40, 65, 30, 80, 55, 72, 48, 90, 60].map((h, k) => (
                        <motion.div
                          key={k}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.3 + k * 0.05 }}
                          className="flex-1 rounded-sm bg-gradient-to-t from-[#2563EB]/80 to-[#0EA5E9]"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Node on connector */}
                  <div className="absolute left-1/2 top-1/2 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB] ring-4 ring-white lg:block" style={{ left: i % 2 ? "-2rem" : "calc(100% + 2rem)" }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
