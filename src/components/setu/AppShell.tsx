import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth, NAV_FOR_ROLE } from "@/lib/auth";
import { useSetu, useHydrated } from "@/lib/use-setu";
import { cn } from "@/lib/utils";
import { Button, StatusDot, fmtTime } from "./ui";

const LINKS = [
  { to: "/capacity", label: "Capacity Engine" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/twin", label: "Digital Twin" },
  { to: "/ulip", label: "ULIP Contract" },
  { to: "/predictive", label: "Predictive Panel" },
] as const;

function LedgerStrip() {
  const { events } = useSetu();
  const recent = [...events].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, 6);

  return (
    <div className="sticky top-[65px] z-[99] border-b border-border-light bg-bg-light-secondary">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 overflow-x-auto px-6 py-3 md:px-16">
        <span className="micro flex shrink-0 items-center gap-2 text-text-primary">
          <StatusDot tone="accent" pulse />
          Live ledger
        </span>
        <div className="flex items-center gap-6">
          {recent.map((e) => (
            <span key={e.id} className="micro flex shrink-0 items-center gap-2 whitespace-nowrap">
              <span className="text-text-primary">{e.vehicle_reg}</span>
              <span>{e.event_type}</span>
              <span className="text-text-muted">{fmtTime(e.ts)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && !user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  if (!hydrated || !ready || !user) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-16">
        <div className="h-3 w-40 animate-pulse rounded bg-black/10" />
      </div>
    );
  }

  const allowed = NAV_FOR_ROLE[user.role];
  const links = LINKS.filter((l) => allowed.includes(l.to));

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="sticky top-0 z-[100] border-b border-border-light bg-bg-light/95 backdrop-blur">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-6 py-4 md:px-16">
          <div className="flex min-w-0 items-center gap-8">
            <Link to="/capacity" className="display shrink-0 text-[19px]">
              Setu-RTN
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "text-[15px] text-text-secondary transition-colors duration-200 hover:text-accent",
                    pathname === l.to && "text-accent",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="micro hidden sm:inline">{user.role}</span>
            <Button
              variant="ghost"
              className="hidden px-0 lg:inline-flex"
              onClick={() => {
                void signOut();
                navigate({ to: "/" });
              }}
            >
              Sign out
            </Button>
            <button
              className="grid size-11 place-items-center lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <Menu className="size-6" strokeWidth={1.75} /> : <Menu className="size-6" strokeWidth={1.75} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-border-light bg-bg-light px-6 py-4 lg:hidden">
            <nav className="flex flex-col">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex min-h-[44px] items-center text-[16px] text-text-secondary",
                    pathname === l.to && "text-accent",
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <button
                className="flex min-h-[44px] items-center text-left text-[16px] text-text-secondary"
                onClick={() => {
                  void signOut();
                  navigate({ to: "/" });
                }}
              >
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      <LedgerStrip />

      <main className="mx-auto max-w-[1400px] px-6 py-16 md:px-16 md:py-24">{children}</main>

      <footer className="mx-auto max-w-[1400px] px-6 pb-16 md:px-16">
        <p className="micro">Setu-RTN · Live capacity. Real routes.</p>
      </footer>
    </div>
  );
}

export { X };
