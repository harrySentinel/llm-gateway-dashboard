import Link from "next/link";
import { PremiumHero } from "@/components/ui/hero";

const FEATURES = [
  {
    title: "Multi-provider",
    desc: "Route requests to Gemini or Groq with a single unified API. Swap providers without touching client code.",
    icon: "⚡",
  },
  {
    title: "Auto-failover",
    desc: "If a provider returns a 5xx error, the gateway automatically retries on the fallback before the stream starts.",
    icon: "🔄",
  },
  {
    title: "Cost tracking",
    desc: "Every request is logged with token counts and USD cost. See exactly what you're spending, per model and per key.",
    icon: "💰",
  },
  {
    title: "API key auth",
    desc: "Issue gw_ prefixed keys to clients. Keys are stored as SHA-256 hashes — never retrievable after creation.",
    icon: "🔑",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Animated hero — full viewport height */}
      <PremiumHero />

      {/* Features */}
      <section className="px-6 py-24 max-w-4xl mx-auto w-full">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-10 font-medium text-center">
          Everything you need
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border border-white/10 rounded-xl p-6 bg-white/5 hover:border-white/20 transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code block */}
      <section className="border-t border-white/10 py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-6 font-medium">
            Drop-in API
          </p>
          <pre className="text-sm font-mono leading-relaxed overflow-x-auto bg-white/5 border border-white/10 rounded-xl p-6">
            <span className="text-gray-500">{"// same shape as OpenAI — just change the URL\n"}</span>
            <span className="text-blue-400">{"const "}</span>
            <span className="text-white">{"res = "}</span>
            <span className="text-yellow-300">{"await "}</span>
            <span className="text-white">{"fetch("}</span>
            <span className="text-green-400">{'"https://your-gateway.fly.dev/v1/chat"'}</span>
            <span className="text-white">{", {\n"}</span>
            <span className="text-white">{"  method: "}</span>
            <span className="text-green-400">{'"POST"'}</span>
            <span className="text-white">{",\n"}</span>
            <span className="text-white">{"  headers: { "}</span>
            <span className="text-green-400">{'"Authorization"'}</span>
            <span className="text-white">{": "}</span>
            <span className="text-green-400">{'"Bearer gw_..."'}</span>
            <span className="text-white">{" },\n"}</span>
            <span className="text-white">{"  body: JSON.stringify({\n"}</span>
            <span className="text-white">{"    model: "}</span>
            <span className="text-green-400">{'"llama-3.3-70b-versatile"'}</span>
            <span className="text-white">{",\n"}</span>
            <span className="text-white">{"    messages: [{ role: "}</span>
            <span className="text-green-400">{'"user"'}</span>
            <span className="text-white">{", content: "}</span>
            <span className="text-green-400">{'"Hello!"'}</span>
            <span className="text-white">{" }],\n"}</span>
            <span className="text-white">{"  }),\n"}</span>
            <span className="text-white">{"});"}</span>
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 flex items-center justify-between text-xs text-gray-500 mt-auto">
        <span>LLM Gateway</span>
        <Link href="/signup" className="hover:text-gray-300 transition-colors">
          Get started →
        </Link>
      </footer>
    </div>
  );
}
