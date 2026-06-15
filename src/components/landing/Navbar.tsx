import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/Logo.png";

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
        hidden: { y: "-100%", opacity: 0 },
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
          <Link to="/" className="flex items-center group">
            <img 
              src={logoAsset} 
              alt="TRACEai Logo" 
              className="h-[38px] w-auto transition-transform duration-200 group-hover:scale-[1.02]" 
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="relative rounded-lg px-3 py-2 text-[13px] font-medium text-[#475569] transition-colors duration-200 hover:text-[#2563EB]"
              >
                <span className="relative z-10">{l.label}</span>
                <span className="absolute inset-0 -z-0 rounded-lg bg-[#0F172A]/0 transition-colors hover:bg-[#0F172A]/[0.04]" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 justify-center rounded-lg bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#0F172A]/90 hover:shadow-md active:scale-[0.98]"
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
