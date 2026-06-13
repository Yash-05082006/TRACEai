import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { label: "Requests Monitored", value: 18.4, suffix: "B", desc: "across production traffic" },
  { label: "Tokens Processed", value: 942, suffix: "T", desc: "with full trace fidelity" },
  { label: "Cost Savings Identified", value: 38, suffix: "M", prefix: "$", desc: "for our customers in 2025" },
  { label: "Response Time Improved", value: 47, suffix: "%", desc: "median p95 reduction" },
];

export function MetricsBand() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[#0F172A]/8 bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1E293B] p-12 lift-shadow">
          {/* Background grid */}
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#2563EB]/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#0EA5E9]/20 blur-3xl" />

          <div className="relative">
            <div className="text-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                Trusted at scale
              </span>
              <h2 className="mt-3 text-[36px] font-semibold tracking-tight text-white sm:text-[44px]">
                The numbers behind every decision
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 lg:grid-cols-4">
              {stats.map((s, i) => (
                <Stat key={s.label} index={i} {...s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  index,
  label,
  value,
  prefix = "",
  suffix = "",
  desc,
}: {
  index: number;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  desc: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    value >= 100 ? Math.round(v).toString() : v.toFixed(1),
  );

  useEffect(() => {
    if (inView) {
      const c = animate(mv, value, { duration: 1.8, ease: [0.22, 1, 0.36, 1] });
      return c.stop;
    }
  }, [inView, mv, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      className="group relative bg-[#0F172A] p-8 transition-colors hover:bg-[#0F172A]/70"
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-0.5 text-[44px] font-semibold tracking-tight text-white">
        <span>{prefix}</span>
        <motion.span>{rounded}</motion.span>
        <span className="text-[#2563EB]">{suffix}</span>
      </div>
      <div className="mt-2 text-[12.5px] text-white/50">{desc}</div>
      <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/0 to-transparent transition-all group-hover:via-[#2563EB]/60" />
    </motion.div>
  );
}
