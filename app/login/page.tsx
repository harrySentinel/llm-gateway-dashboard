"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { CursorSpotlight } from "@/components/ui/cursor-spotlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

const item = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw new Error(authError.message);
      router.push("/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Cursor spotlight */}
      <CursorSpotlight />

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Card */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative z-30 w-full max-w-sm"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl">
          {/* Logo */}
          <motion.div variants={item} className="mb-8">
            <Link href="/" className="text-base font-semibold text-white tracking-tight">
              LLM Gateway
            </Link>
          </motion.div>

          {/* Heading */}
          <motion.div variants={item} className="mb-6">
            <h1 className="text-xl font-semibold text-white">Welcome back</h1>
            <p className="text-sm text-white/40 mt-1">Sign in to your dashboard</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={item} className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wide">
                Email
              </Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-500/50 focus-visible:border-white/20"
              />
            </motion.div>

            <motion.div variants={item} className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wide">
                Password
              </Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-500/50 focus-visible:border-white/20"
              />
            </motion.div>

            {error && (
              <motion.div
                variants={item}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <motion.div variants={item}>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-black text-sm font-medium py-2.5 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
              </button>
            </motion.div>
          </form>

          <motion.p
            variants={item}
            className="mt-6 text-center text-sm text-white/30"
          >
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-white/60 hover:text-white transition-colors">
              Sign up
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
