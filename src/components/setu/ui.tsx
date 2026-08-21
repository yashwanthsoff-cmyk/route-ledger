import { ArrowRight, Loader2, X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Card --------------------------------- */

export function Card({
  children,
  className,
  live,
  hoverable = true,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  live?: boolean;
  hoverable?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "card-surface p-6 md:p-8",
        hoverable && "hover:-translate-y-[3px] hover:shadow-[var(--shadow-hover)]",
        live && "live-highlight animate-[live-flash_800ms_ease-out_1]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Buttons -------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "secondary" | "ghost";
  loading?: boolean;
  pill?: boolean;
};

export function Button({
  variant = "outline",
  loading = false,
  pill = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-3 text-[15px] font-medium transition-colors duration-200",
        pill ? "rounded-[var(--radius-pill)]" : "rounded-[var(--radius-sm)]",
        variant === "primary" &&
          "bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed",
        variant === "outline" &&
          "border border-accent bg-transparent text-accent hover:bg-accent/5 active:bg-accent/10",
        variant === "secondary" && "px-0 text-accent hover:text-accent-hover",
        variant === "ghost" && "text-text-secondary hover:text-text-primary",
        isDisabled && "pointer-events-none opacity-45",
        className,
      )}
    >
      {loading && <Loader2 className="size-5 animate-spin" strokeWidth={1.75} />}
      {children}
      {variant === "secondary" && !loading && <ArrowRight className="size-4" strokeWidth={1.75} />}
    </button>
  );
}

/* ---------------------------------- Forms --------------------------------- */

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="micro">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[13px] text-text-secondary">{hint}</p>}
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const controlCls =
  "min-h-[44px] w-full rounded-[var(--radius-sm)] border border-border-light bg-bg-light px-4 py-3 text-[16px] text-text-primary transition-colors duration-200 placeholder:text-text-muted focus:border-accent disabled:bg-bg-light-secondary disabled:text-text-muted";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlCls, "num", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlCls, props.className)} />;
}

/* ------------------------------ Data states ------------------------------ */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card-surface animate-pulse p-6 md:p-8", className)}>
      <div className="h-3 w-24 rounded bg-black/10" />
      <div className="mt-6 h-10 w-28 rounded bg-black/10" />
      <div className="mt-6 h-3 w-full rounded bg-black/5" />
      <div className="mt-2 h-3 w-2/3 rounded bg-black/5" />
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-start gap-4 p-8">
      <p className="text-text-secondary">{title}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card-surface flex flex-col items-start gap-4 p-8">
      <p className="text-danger">{message}</p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}

/* --------------------------------- Modal ---------------------------------- */

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-border-light bg-bg-light p-8 animate-[enter_400ms_ease-out]"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl">{title}</h3>
          <button aria-label="Close" onClick={onCancel} className="text-text-secondary">
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="mt-4 text-[15px] text-text-secondary">{body}</div>
        {error && (
          <p role="alert" className="mt-4 text-[13px] text-danger">
            {error}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button variant="primary" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Bits ----------------------------------- */

export function StatusDot({
  tone,
  pulse,
  className,
}: {
  tone: "success" | "warning" | "muted" | "danger" | "accent";
  pulse?: boolean;
  className?: string;
}) {
  const color =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "danger"
          ? "bg-danger"
          : tone === "accent"
            ? "bg-accent"
            : "bg-text-muted";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        color,
        pulse && "animate-[pulse-dot_1.6s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

export function PageHeader({ title, lede }: { title: string; lede: string }) {
  return (
    <header className="max-w-[600px] animate-[enter_450ms_ease-out]">
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      <p className="mt-4 text-[17px] text-text-secondary">{lede}</p>
    </header>
  );
}

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
