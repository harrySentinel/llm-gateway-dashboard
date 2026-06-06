"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { MoveRight, Zap } from "lucide-react";
import { BeamBackground } from "@/components/ui/beam-background";

const words = ["intelligently", "reliably", "efficiently", "at scale", "securely"];

export function PremiumHero() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setWordIndex((p) => (p + 1) % words.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <BeamBackground />

      {/* Top nav */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5">
        <span className="text-sm font-semibold text-white/90 tracking-tight">
          LLM Gateway
        </span>
        <Link
          href="/login"
          className="text-sm text-white/50 hover:text-white/90 transition-colors"
        >
          Sign in
        </Link>
      </div>

      {/* Hero content */}
      <div className="relative z-20 flex h-screen w-full items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Gemini · Groq · more providers coming
          </div>

          <h1 className="text-5xl md:text-7xl tracking-tighter font-semibold leading-tight">
            <span className="text-white">Route AI calls</span>
            <span className="relative flex w-full justify-center overflow-hidden pb-2 pt-1">
              &nbsp;
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  className="absolute text-cyan-400"
                  initial={{ opacity: 0, y: "-100" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    wordIndex === index
                      ? { y: 0, opacity: 1 }
                      : { y: wordIndex > index ? -150 : 150, opacity: 0 }
                  }
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>

          <p className="text-base md:text-lg leading-relaxed text-white/50 max-w-lg">
            A self-hosted proxy that routes LLM requests across providers with
            automatic failover, per-key cost tracking, and full observability.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            Get started free <MoveRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
