import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import heroVisual from "@/assets/hero_visual.png.asset.json";


const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative pt-20 pb-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#0F172A]/8 bg-white/70 px-3 py-1.5 backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
          <span className="text-[12px] font-medium text-[#475569]">
            Introducing the AI Optimization Agent
          </span>
          <span className="text-[12px] font-medium text-[#2563EB]">Read more →</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
          className="mx-auto mt-8 max-w-5xl text-center text-[56px] font-semibold leading-[1.02] tracking-[-0.035em] text-[#0F172A] sm:text-[72px] lg:text-[88px]"
        >
          {["Monitor AI Usage.", "Track Costs.", "Optimize LLM Spend."].map((line, i) => (
            <motion.span
              key={line}
              variants={{
                hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
                show: { opacity: 1, y: 0, filter: "blur(0px)" },
              }}
              transition={{ duration: 0.9, ease }}
              className="block"
            >
              {i === 2 ? <span className="text-gradient">{line}</span> : line}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease }}
          className="mx-auto mt-7 max-w-2xl text-center text-[17px] leading-relaxed text-[#475569]"
        >
          The observability platform built for AI-native teams. Trace every request,
          measure token-level cost, and let our optimization agent cut your LLM
          spend by up to 60% without sacrificing quality.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.8, ease }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <button className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#0F172A] px-6 py-3.5 text-[14px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]">
            <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="absolute -inset-2 -z-20 rounded-2xl bg-[#2563EB]/40 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button className="group inline-flex items-center gap-2 rounded-xl border border-[#0F172A]/10 bg-white/70 px-6 py-3.5 text-[14px] font-semibold text-[#0F172A] backdrop-blur transition-all hover:bg-white hover:shadow-lg">
            <PlayCircle className="h-4 w-4 text-[#2563EB]" />
            View Demo
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-6 text-center text-[12px] uppercase tracking-[0.18em] text-[#94A3B8]"
        >
          SOC 2 Type II · GDPR · HIPAA ready
        </motion.p>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 1.1, ease }}
          className="relative mt-20"
        >
          <img
            src={heroVisual.url}
            alt="Techies LLM observability data flow visualization"
            className="mx-auto h-auto w-full max-w-6xl select-none"
            style={{
              maskImage:
                "radial-gradient(ellipse 90% 80% at 50% 50%, black 60%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 90% 80% at 50% 50%, black 60%, transparent 100%)",
            }}
            draggable={false}
          />
        </motion.div>

      </div>
    </section>
  );
}
