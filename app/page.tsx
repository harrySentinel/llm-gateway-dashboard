import Link from "next/link";
import { Layers, ShieldCheck, BarChart3, KeyRound } from "lucide-react";
import { PremiumHero } from "@/components/ui/hero";

const STEPS = [
  {
    number: "01",
    title: "Create an account",
    desc: "Sign up and land straight on your dashboard. No credit card, no setup wizard.",
  },
  {
    number: "02",
    title: "Issue an API key",
    desc: "Generate a gw_ key from the dashboard. Point any OpenAI-compatible client at your gateway URL.",
  },
  {
    number: "03",
    title: "Monitor everything",
    desc: "Every request is logged with model, provider, tokens, cost, and latency — visible in real time.",
  },
];

const FEATURES = [
  {
    Icon: Layers,
    title: "Multi-provider routing",
    desc: "Gemini and Groq behind one endpoint. Switch models by changing a string — no client changes needed.",
  },
  {
    Icon: ShieldCheck,
    title: "Automatic failover",
    desc: "If a provider returns a 5xx before the stream starts, the gateway retries on the fallback automatically.",
  },
  {
    Icon: BarChart3,
    title: "Cost tracking",
    desc: "Per-model pricing built in. See USD cost per request, per key, and over time in the Overview charts.",
  },
  {
    Icon: KeyRound,
    title: "API key auth",
    desc: "Issue gw_ prefixed keys to your apps. Stored as SHA-256 hashes — plaintext is never stored.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[#080808] text-white">
      {/* Animated hero — full viewport */}
      <PremiumHero />

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-t border-white/10 px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-white/30 font-medium mb-12 text-center">
            How it works
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden">
            {STEPS.map((step) => (
              <div key={step.number} className="bg-[#080808] p-8 flex flex-col gap-4">
                <span className="text-3xl font-bold text-white/10 font-mono">
                  {step.number}
                </span>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-white/30 font-medium mb-12 text-center">
            Built-in capabilities
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white/60" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────── */}
      <section className="border-t border-white/10 px-6 py-20 md:py-28 text-center">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Ready to ship?
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Create an account, issue your first key, and start routing LLM
            calls in under two minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
          >
            Get started free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
        <span>LLM Gateway</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-white/60 transition-colors">Sign in</Link>
          <Link href="/signup" className="hover:text-white/60 transition-colors">Get started</Link>
        </div>
      </footer>
    </div>
  );
}
