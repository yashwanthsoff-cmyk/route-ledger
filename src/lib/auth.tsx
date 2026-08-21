import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase } from "./supabase";
import type { Role } from "./setu-store";

export type SetuUser = { email: string; role: Role; demo: boolean };

type AuthCtx = {
  user: SetuUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsJudge: () => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "setu-rtn.session";

function roleFromEmail(email: string): Role {
  const e = email.toLowerCase();
  if (e.includes("3pl") || e.includes("partner")) return "3pl";
  if (e.includes("directorate") || e.includes("judge")) return "directorate";
  return "dispatcher";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SetuUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw) as SetuUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = (u: SetuUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
  };

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      ready,
      signIn: async (email, password) => {
        const supabase = getSupabase();
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw new Error(error.message);
          let role: Role = roleFromEmail(email);
          const uid = data.user?.id;
          if (uid) {
            const { data: profile } = await supabase
              .from("profile")
              .select("role")
              .eq("id", uid)
              .maybeSingle();
            if (profile?.["role"]) role = profile["role"] as Role;
          }
          persist({ email, role, demo: false });
          return;
        }
        if (!password) throw new Error("Password is required.");
        persist({ email, role: roleFromEmail(email), demo: false });
      },
      signInAsJudge: () => persist({ email: "judge@setu-rtn.gov.in", role: "directorate", demo: true }),
      signOut: async () => {
        await getSupabase()?.auth.signOut();
        persist(null);
      },
    }),
    [user, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const NAV_FOR_ROLE: Record<Role, string[]> = {
  dispatcher: ["/capacity", "/marketplace", "/twin", "/ulip", "/predictive"],
  directorate: ["/capacity", "/marketplace", "/twin", "/ulip", "/predictive"],
  "3pl": ["/marketplace", "/predictive"],
};
