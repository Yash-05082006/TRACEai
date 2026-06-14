import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Activity, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#calculator" },
  { label: "Integrations", href: "#integrations" },
  { label: "Demo", href: "#hero" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 120], [0.5, 0.95]);
  const borderOpacity = useTransform(scrollY, [0, 120], [0, 0.08]);

  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.header
      className="fixed top-0 z-50 w-full"
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-100%", opacity: 0 }
      }}
      initial="visible"
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <motion.div
        style={{
          backgroundColor: useTransform(bgOpacity, (o) => `rgba(255,255,255,${o})`),
          borderBottomColor: useTransform(borderOpacity, (o) => `rgba(15,23,42,${o})`),
        }}
        className="border-b backdrop-blur-xl backdrop-saturate-150"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="#hero" className="flex items-center gap-2 group">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#0F172A] text-white">
              <Activity className="h-4 w-4" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
              <div className="absolute -inset-1 -z-10 rounded-2xl bg-[#2563EB]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#0F172A]">TRACEai</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(l.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative rounded-lg px-3 py-2 text-[13px] font-medium text-[#475569] transition-colors duration-200 hover:text-[#2563EB]"
              >
                <span className="relative z-10">{l.label}</span>
                <span className="absolute inset-0 -z-0 rounded-lg bg-[#0F172A]/0 transition-colors hover:bg-[#0F172A]/[0.04]" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#0F172A]/90"
            >
              Open Platform
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}

