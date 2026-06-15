import { motion } from "framer-motion";

/**
 * Premium aura background - large blurred gradient blobs that drift very slowly.
 * Scoped to its parent section (absolute). Place inside a `relative` container.
 * Sits ABOVE the global grid but BELOW content. Use behind Hero / Problem only.
 */
export function AuraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden">
      {/* Primary TRACEai blue blob */}
      <motion.div
        className="absolute -top-32 left-1/4 h-[680px] w-[680px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, rgba(79,111,255,0.18), rgba(79,111,255,0) 70%)",
          filter: "blur(40px)",
        }}
        animate={{
          x: [0, 60, -20, 0],
          y: [0, 30, -10, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Soft indigo */}
      <motion.div
        className="absolute top-10 right-0 h-[560px] w-[560px] rounded-full will-change-transform hidden sm:block"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.14), rgba(99,102,241,0) 70%)",
          filter: "blur(50px)",
        }}
        animate={{
          x: [0, -50, 20, 0],
          y: [0, 40, 10, 0],
          scale: [1, 1.06, 1.02, 1],
        }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Light cyan accent */}
      <motion.div
        className="absolute bottom-0 left-0 h-[460px] w-[460px] rounded-full will-change-transform hidden md:block"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.10), rgba(34,211,238,0) 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
