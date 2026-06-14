import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Bell, Settings, User, Activity } from "lucide-react";

const links = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Analytics", to: "/analytics" },
  { label: "Logs", to: "/logs" },
  { label: "Cost Optimizer", to: "/cost-optimizer" },
  { label: "Integrations", to: "/integrations" },
] as const;

export function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 120], [0.5, 0.95]);
  const borderOpacity = useTransform(scrollY, [0, 120], [0, 0.08]);

  return (
    <motion.header
      className="sticky top-0 z-50 w-full"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        style={{
          backgroundColor: useTransform(bgOpacity, (o) => `rgba(255,255,255,${o})`),
          borderBottomColor: useTransform(borderOpacity, (o) => `rgba(15,23,42,${o})`),
        }}
        className="border-b backdrop-blur-xl backdrop-saturate-150"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="#" className="flex items-center gap-2 group">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#0F172A] text-white">
              <Activity className="h-4 w-4" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
              <div className="absolute -inset-1 -z-10 rounded-2xl bg-[#2563EB]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#0F172A]">Techies</span>
            <span className="ml-1 rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#2563EB]">
              Beta
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="relative rounded-lg px-3 py-2 text-[13px] font-medium text-[#475569] transition-colors hover:text-[#0F172A] hover:bg-[#0F172A]/[0.04]"
                activeProps={{ className: "text-[#0F172A] bg-[#0F172A]/[0.05]" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <IconButton><Bell className="h-4 w-4" /></IconButton>
            <IconButton><Settings className="h-4 w-4" /></IconButton>
            <div className="ml-2 flex items-center gap-2 rounded-full border border-[#0F172A]/8 bg-white/70 py-1 pl-1 pr-3">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] text-white">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="text-[12px] font-medium text-[#0F172A]">Aria</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="grid h-9 w-9 place-items-center rounded-lg text-[#475569] transition-all hover:bg-[#0F172A]/[0.05] hover:text-[#0F172A] active:scale-95">
      {children}
    </button>
  );
}
