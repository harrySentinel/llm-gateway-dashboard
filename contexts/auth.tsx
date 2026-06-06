"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically import so missing env vars never crash the module at parse time
    import("@/lib/supabase")
      .then(({ createClient }) => {
        let supabase: ReturnType<typeof createClient>;
        try {
          supabase = createClient();
        } catch {
          // Env vars not configured — stay logged out, stop loading
          setLoading(false);
          return;
        }

        void (async () => {
          try {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
          } catch {
            // Supabase unreachable — treat as unauthenticated
          } finally {
            setLoading(false);
          }
        })();

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          },
        );

        return () => subscription.unsubscribe();
      })
      .catch(() => setLoading(false));
  }, []);

  async function signOut() {
    try {
      const { createClient } = await import("@/lib/supabase");
      await createClient().auth.signOut();
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
