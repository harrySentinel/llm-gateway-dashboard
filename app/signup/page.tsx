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

const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL ?? "";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (ALLOWED_EMAIL && email.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      setError("Registration is closed. Contact the administrator.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error(authError.message);
      if (data.session) {
        router.push("/overview");
        router.refresh();
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 relative overflow-hidden">
        <CursorSpotlight />
        <div className="relative z-30 w-full max-w-sm text-center">
          <div className="text-3xl mb-4">📬</div>
          <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
          <p className="text-sm text-white/40 mb-6">
            Confirmation link sent to <span className="text-white/70">{email}</span>.
          </p>
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
            Back to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#080808]">
      <CursorSpotlight />

      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Left panel */}
      <div className="relative z-30 w-full md:w-1/2 flex flex-col items-center justify-center px-8 py-12 md:px-14">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm"
        >
          <motion.div variants={item} className="mb-10">
            <Link href="/" className="text-base font-semibold text-white tracking-tight">
              LLM Gateway
            </Link>
          </motion.div>

          <motion.div variants={item} className="mb-8">
            <h1 className="text-2xl font-semibold text-white">Create an account</h1>
            <p className="text-sm text-white/40 mt-1">Get started with your gateway</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={item} className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-widest font-medium">
                Email
              </Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 h-11"
              />
            </motion.div>

            <motion.div variants={item} className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-widest font-medium">
                Password
              </Label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 h-11"
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

            <motion.div variants={item} className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-black text-sm font-semibold h-11 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create account
              </button>
            </motion.div>
          </form>

          <motion.p variants={item} className="mt-8 text-sm text-white/30 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-white/60 hover:text-white transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="hidden md:block relative w-1/2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80"
          alt="Technology background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-transparent to-transparent w-1/3" />
        <div className="absolute inset-0 bg-black/30" />
      </div>
    </div>
  );
}
