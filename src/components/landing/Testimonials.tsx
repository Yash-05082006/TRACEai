import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { SectionHeader } from "./Features";

const testimonials = [
  {
    quote:
      "Techies paid for itself in the first eleven days. The agent caught a runaway summarization loop that would have cost us $34k that month.",
    name: "Lina Okafor",
    role: "Head of Platform, Vertex AI Labs",
    avatar: "LO",
    color: "#2563EB",
  },
  {
    quote:
      "We finally have one source of truth across OpenAI, Anthropic, and our self-hosted models. Engineering and finance speak the same language now.",
    name: "Marcus Chen",
    role: "Director of ML Infrastructure, Lumen",
    avatar: "MC",
    color: "#10B981",
  },
  {
    quote:
      "The depth of the cost attribution is genuinely surgical. We can trace a single feature's spend down to the prompt template version.",
    name: "Priya Raghavan",
    role: "Staff Engineer, Northwind",
    avatar: "PR",
    color: "#F59E0B",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Customer stories"
          title="What teams say after 30 days"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col rounded-3xl border border-[#0F172A]/8 bg-white p-8 transition-all hover:soft-shadow"
            >
              <Quote className="h-7 w-7 text-[#2563EB]/30" />
              <p className="mt-5 flex-1 text-[16px] leading-relaxed text-[#0F172A]">
                "{t.quote}"
              </p>
              <div className="mt-8 flex items-center gap-3 border-t border-[#0F172A]/6 pt-6">
                <div
                  className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}aa)` }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#0F172A]">{t.name}</div>
                  <div className="text-[12px] text-[#64748B]">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logo strip */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
          {["VERTEX", "LUMEN", "NORTHWIND", "AXIOM", "MERIDIAN", "HELIOS"].map((l) => (
            <span key={l} className="text-[15px] font-bold tracking-[0.2em] text-[#0F172A]/40">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
