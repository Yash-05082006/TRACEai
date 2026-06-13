import { motion } from "framer-motion";

export function BackgroundSystem() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_40%,#F1F5F9_100%)]" />
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-70" />
      {/* Radial glows */}
      <motion.div
        className="absolute -top-40 -left-40 h-[640px] w-[640px] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(37,99,235,0.28), transparent 70%)" }}
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 h-[560px] w-[560px] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(14,165,233,0.22), transparent 70%)" }}
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[520px] w-[520px] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.16), transparent 70%)" }}
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Noise */}
      <div className="absolute inset-0 noise" />
    </div>
  );
}
