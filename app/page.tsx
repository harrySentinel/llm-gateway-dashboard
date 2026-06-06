import Link from "next/link";

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <span className="font-semibold text-gray-900 tracking-tight">
          LLM Gateway
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full mb-6 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Gemini · Groq · more coming soon
        </div>

        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5 max-w-2xl">
          Your own LLM Gateway
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-xl leading-relaxed">
          A self-hosted proxy that routes LLM requests across providers, handles
          failover automatically, and gives you full observability — cost, latency,
          and usage per API key.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Get started →
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Already have an account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code block */}
      <section className="bg-gray-950 py-16 px-6 shrink-0">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4 font-medium">
            Drop-in API
          </p>
          <pre className="text-sm font-mono leading-relaxed overflow-x-auto">
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
      <footer className="border-t border-gray-200 px-6 py-5 flex items-center justify-between text-xs text-gray-400 shrink-0">
        <span>LLM Gateway</span>
        <Link href="/login" className="hover:text-gray-600 transition-colors">
          Sign in →
        </Link>
      </footer>
    </div>
  );
}
