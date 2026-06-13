import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative pb-32 pt-16">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[36px] border border-[#0F172A]/10 bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1E3A8A] p-16 text-center lift-shadow"
        >
          {/* Atmospheric layers */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
          }} />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#2563EB]/40 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-[#0EA5E9]/30 blur-3xl"
          />

          <div className="relative">
            <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur">
              Start free · 14 days
            </span>
            <h2 className="mx-auto mt-6 max-w-3xl text-[52px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[72px]">
              Bring observability to every token you ship.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/60">
              Connect your first model in under four minutes. See your first
              optimization recommendation before your coffee gets cold.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-[14px] font-semibold text-[#0F172A] transition-transform hover:scale-[1.03] active:scale-[0.98]">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button className="rounded-xl border border-white/15 bg-white/5 px-7 py-4 text-[14px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10">
                Talk to sales
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-white/40">
              <span>No credit card required</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>SOC 2 Type II</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>4-minute setup</span>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-[#0F172A]/8 pt-10">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#0F172A] text-[10px] font-bold text-white">T</div>
            <span className="text-[13px] font-semibold text-[#0F172A]">Techies</span>
            <span className="text-[12px] text-[#94A3B8]">© 2026</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#64748B]">
            {["Platform", "Pricing", "Docs", "Changelog", "Security", "Status"].map((l) => (
              <a key={l} href="#" className="hover:text-[#0F172A]">{l}</a>
            ))}
          </div>
        </footer>
      </div>
    </section>
  );
}
