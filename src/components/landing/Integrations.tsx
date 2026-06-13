import { motion } from "framer-motion";
import { SectionHeader } from "./Features";

const integrations = [
  { name: "OpenAI", desc: "GPT-4o, o1, embeddings, Whisper", color: "#10A37F", letter: "O" },
  { name: "Anthropic", desc: "Claude 3.5 Sonnet, Haiku, Opus", color: "#D4A27F", letter: "A" },
  { name: "Google Gemini", desc: "Gemini 1.5 Pro, Flash, Nano", color: "#4285F4", letter: "G" },
  { name: "Mistral", desc: "Mistral Large, Codestral, Embed", color: "#FF7000", letter: "M" },
  { name: "Cohere", desc: "Command R+, Rerank, Embed v3", color: "#39594D", letter: "C" },
  { name: "Custom APIs", desc: "OpenAI-compatible · OTel traces", color: "#0F172A", letter: "+" },
];

export function Integrations() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Integrations"
          title="Every model. One pane of glass."
          desc="Whether you ship with one provider or orchestrate twelve, Techies normalizes traces, costs, and metrics into a single schema."
        />

        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3">
          {integrations.map((i, idx) => (
            <motion.div
              key={i.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-3xl border border-[#0F172A]/8 bg-white p-6 transition-all hover:soft-shadow"
            >
              <div
                className="absolute -inset-px -z-10 rounded-3xl opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
                style={{ background: `radial-gradient(circle at 30% 0%, ${i.color}, transparent 60%)` }}
              />
              <div className="flex items-center gap-4">
                <div
                  className="grid h-14 w-14 place-items-center rounded-2xl text-[22px] font-bold text-white"
                  style={{ background: i.color }}
                >
                  {i.letter}
                </div>
                <div>
                  <div className="text-[16px] font-semibold text-[#0F172A]">{i.name}</div>
                  <div className="text-[12.5px] text-[#64748B]">{i.desc}</div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-[#0F172A]/6 pt-4">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#10B981]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                  Connected
                </span>
                <span className="text-[11px] font-semibold text-[#2563EB] opacity-0 transition-opacity group-hover:opacity-100">
                  Configure →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
