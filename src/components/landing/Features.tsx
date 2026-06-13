import { motion } from "framer-motion";
import {
  Activity,
  Coins,
  LineChart,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "AI Usage Monitoring",
    desc: "Trace every prompt, completion, tool call, and agent step with millisecond fidelity across every model.",
    accent: "#2563EB",
  },
  {
    icon: Coins,
    title: "Token Tracking",
    desc: "Per-user, per-feature, per-prompt token accounting. Detect runaway loops before they bill you.",
    accent: "#0EA5E9",
  },
  {
    icon: LineChart,
    title: "Cost Analytics",
    desc: "Multi-dimensional breakdowns by model, environment, customer, and feature. Forecast next month with confidence.",
    accent: "#10B981",
  },
  {
    icon: Gauge,
    title: "Performance Monitoring",
    desc: "p50, p95, p99 latency by route and model. Compare providers side-by-side with statistical rigor.",
    accent: "#F59E0B",
  },
  {
    icon: ShieldCheck,
    title: "Reliability Tracking",
    desc: "Live SLA scoring, fallback chains, rate-limit detection, and PII redaction baked into the pipeline.",
    accent: "#6366F1",
  },
  {
    icon: Sparkles,
    title: "Optimization Agent",
    desc: "Autonomous recommendations: model routing, caching, prompt compression, context pruning. With evaluated impact.",
    accent: "#EF4444",
  },
];

export function Features() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Platform"
          title="Six surfaces. One source of truth."
          desc="Every signal you need to operate AI in production, in one elegantly composed workspace."
        />

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-3xl border border-[#0F172A]/8 bg-white p-7 transition-all hover:soft-shadow"
            >
              {/* Glow on hover */}
              <div
                className="absolute -inset-px -z-10 rounded-3xl opacity-0 blur-2xl transition-opacity group-hover:opacity-30"
                style={{ background: `radial-gradient(circle at top left, ${f.accent}, transparent 60%)` }}
              />
              <div
                className="relative grid h-12 w-12 place-items-center rounded-2xl text-white"
                style={{ background: `linear-gradient(135deg, ${f.accent}, ${f.accent}99)` }}
              >
                <f.icon className="h-5 w-5" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-white/30" />
              </div>
              <h3 className="mt-5 text-[20px] font-semibold tracking-tight text-[#0F172A]">
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#64748B]">{f.desc}</p>

              <div className="mt-6 flex items-center gap-1.5 text-[12px] font-semibold text-[#0F172A] opacity-0 transition-opacity group-hover:opacity-100">
                <span style={{ color: f.accent }}>Explore</span>
                <span style={{ color: f.accent }}>→</span>
              </div>

              {/* Decorative corner */}
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full opacity-[0.04] transition-opacity group-hover:opacity-[0.08]" style={{ background: f.accent }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#2563EB]/15 bg-[#2563EB]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563EB]"
      >
        <span className="h-1 w-1 rounded-full bg-[#2563EB]" />
        {eyebrow}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.05 }}
        className="mt-5 text-[40px] font-semibold tracking-[-0.025em] text-[#0F172A] sm:text-[52px]"
      >
        {title}
      </motion.h2>
      {desc && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 text-[17px] leading-relaxed text-[#64748B]"
        >
          {desc}
        </motion.p>
      )}
    </div>
  );
}
