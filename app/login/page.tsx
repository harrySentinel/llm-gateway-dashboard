"use client";

import { useRouter } from "next/navigation";
import { AuthFormSplitScreen } from "@/components/ui/login";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    router.push("/overview");
    router.refresh();
  }

  return (
    <AuthFormSplitScreen
      logo={
        <span className="text-xl font-semibold tracking-tight text-foreground">
          LLM Gateway
        </span>
      }
      title="Welcome back"
      description="Sign in to your dashboard to continue"
      imageSrc="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80"
      imageAlt="Circuit board technology"
      onSubmit={handleLogin}
      forgotPasswordHref="#"
      createAccountHref="/signup"
    />
  );
}
