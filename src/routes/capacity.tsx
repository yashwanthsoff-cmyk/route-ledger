import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/setu/AppShell";
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  SkeletonCard,
  StatusDot,
  fmtTime,
} from "@/components/setu/ui";
import { invokeFunction, TOUCHPOINTS, type Confidence } from "@/lib/setu-store";
import { useLiveHighlight, useLoadingPass, useSetu } from "@/lib/use-setu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/capacity")({
  head: () => ({
    meta: [
      { title: "Capacity Engine — Setu-RTN" },
      {
        name: "description",
        content:
          "Live fleet capacity per touchpoint with judge-editable recompute, confidence overrides and a full audit trail of superseded readings.",
      },
      { property: "og:title", content: "Capacity Engine — Setu-RTN" },
      {
        property: "og:description",
        content: "Live vehicle fill levels, editable recompute and confidence overrides with audit trail.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <CapacityEngine />
    </AppShell>
  ),
});

const dotTone = (c: Confidence) => (c === "high" ? "success" : c === "medium" ? "warning" : "muted");

function CapacityEngine() {
  const { vehicles, events } = useSetu();
  const loading = useLoadingPass();
  const [selected, setSelected] = useState("RJ14GA3821");

  const vehicle = vehicles.find((v) => v.registration === selected) ?? vehicles[0];
  const vehicleEvents = useMemo(
    () =>
      events
        .filter((e) => e.vehicle_reg === vehicle?.registration)
        .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)),
    [events, vehicle],
  );

  return (
    <div className="flex flex-col gap-16">
      <PageHeader
        title="Capacity Engine"
        lede="Every vehicle's live fill level, recomputed from the same ledger the marketplace, twin and forecast read from."
      />

      <section className="flex flex-col gap-6">
        <h2 className="micro">Fleet overview</h2>
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState title="No vehicles on this route yet." />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                reg={v.registration}
                touchpoint={v.current_touchpoint}
                pct={v.capacity_pct}
                confidence={v.confidence}
                active={v.registration === selected}
                onSelect={() => setSelected(v.registration)}
              />
            ))}
          </div>
        )}
      </section>

      {vehicle && (
        <section className="grid gap-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-2xl">{vehicle.registration}</h2>
              <p className="micro mt-2">Ahmedabad → Ajmer → Jaipur</p>
            </div>
            <TouchpointTrack current={vehicle.current_touchpoint} />
            <AuditTrail
              events={vehicleEvents.map((e) => ({
                id: e.id,
                line: `${e.touchpoint} · ${e.event_type} · ${e.capacity_pct}% · ${e.entered_by}`,
                ts: e.ts,
                superseded: e.superseded,
              }))}
            />
          </div>
          <RecomputeForm reg={vehicle.registration} />
        </section>
      )}
    </div>
  );
}

function VehicleCard({
  reg,
  touchpoint,
  pct,
  confidence,
  active,
  onSelect,
}: {
  reg: string;
  touchpoint: string;
  pct: number;
  confidence: Confidence;
  active: boolean;
  onSelect: () => void;
}) {
  const live = useLiveHighlight(pct);
  const [pop, setPop] = useState(false);
  const [override, setOverride] = useState<{ open: boolean; value: string }>({ open: false, value: String(pct) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ before: number; after: number; touchpoint: string } | null>(null);

  const submitOverride = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await invokeFunction<{ before: number; after: number; touchpoint: string }>(
        "override-capacity-event",
        { vehicle_reg: reg, capacity_pct: Number(override.value) },
      );
      setResult(res);
      setOverride({ open: false, value: override.value });
      setPop(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Override failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      live={live}
      className={cn("relative", active && "border-accent")}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <p className="micro">{reg}</p>
      <p className="display mt-4 text-5xl num">{pct}%</p>
      <p className="mt-4 text-[15px] text-text-secondary">{touchpoint}</p>
      <button
        className="mt-4 flex min-h-[44px] items-center gap-2"
        onClick={(e) => {
          e.stopPropagation();
          setPop((v) => !v);
        }}
        aria-expanded={pop}
      >
        <StatusDot tone={dotTone(confidence)} />
        <span className="micro">{confidence} confidence</span>
      </button>

      {pop && (
        <div
          className="absolute left-6 top-full z-[200] mt-2 w-[260px] rounded-[var(--radius-md)] border border-border-light bg-bg-light p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="micro">Reading source</p>
          <p className="mt-2 text-[15px]">Ledger · confidence_flag: {confidence}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setOverride({ open: true, value: String(pct) })}
          >
            Override this reading
          </Button>
        </div>
      )}

      {result && (
        <p className="mt-4 text-[13px] text-text-secondary num">
          {result.touchpoint}: was {result.before}%, now {result.after}%
        </p>
      )}

      <ConfirmModal
        open={override.open}
        title="Override capacity reading"
        loading={busy}
        error={error}
        confirmLabel="Override"
        onCancel={() => setOverride((s) => ({ ...s, open: false }))}
        onConfirm={submitOverride}
        body={
          <div onClick={(e) => e.stopPropagation()}>
            <p>
              This writes a supervisor override for {reg} and supersedes the current reading. The original event stays
              in the audit trail.
            </p>
            <div className="mt-6">
              <Field label="New capacity %">
                <Input
                  type="number"
                  value={override.value}
                  onChange={(e) => setOverride((s) => ({ ...s, value: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        }
      />
    </Card>
  );
}

function TouchpointTrack({ current }: { current: string }) {
  const idx = TOUCHPOINTS.findIndex((t) => t.name === current);
  return (
    <div>
      <div className="flex gap-2">
        {TOUCHPOINTS.map((t, i) => (
          <div key={t.id} className="flex-1">
            <div className={cn("h-1 rounded-[var(--radius-pill)]", i <= idx ? "bg-accent" : "bg-text-muted/40")} />
            <p className={cn("micro mt-3", i === idx && "text-accent")}>{t.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTrail({
  events,
}: {
  events: { id: string; line: string; ts: string; superseded: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border-light pt-6">
      <button className="flex min-h-[44px] items-center gap-2 text-accent" onClick={() => setOpen((v) => !v)}>
        <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} strokeWidth={1.75} />
        <span className="text-[15px]">Event history ({events.length})</span>
      </button>
      {open && (
        <ul className="mt-4 flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light pb-3">
              <span className={cn("micro", e.superseded && "line-through")}>{e.line}</span>
              <span className="micro text-text-muted">{fmtTime(e.ts)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecomputeForm({ reg }: { reg: string }) {
  const [touchpoint, setTouchpoint] = useState("Ajmer");
  const [weight, setWeight] = useState("5200");
  const [eventType, setEventType] = useState("load");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [resubmit, setResubmit] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await invokeFunction<{ previous_pct: number; new_pct: number }>("submit-capacity-event", {
        vehicle_reg: reg,
        touchpoint,
        event_type: eventType,
        weight_kg: Number(weight),
      });
      setOk(`Recomputed: was ${res.previous_pct}%, now ${res.new_pct}%.`);
      setResubmit(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
      setResubmit(true);
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!weight.trim()) {
      setError("Weight is required.");
      return;
    }
    if (resubmit) setConfirm(true);
    else void run();
  };

  return (
    <Card hoverable={false} className="h-fit">
      <h3 className="text-xl">Recompute capacity</h3>
      <p className="mt-3 text-[15px] text-text-secondary">
        Submits a real capacity event through submit-capacity-event. Validation errors come back verbatim.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-6">
        <Field label="Touchpoint" htmlFor="tp">
          <Select id="tp" value={touchpoint} onChange={(e) => setTouchpoint(e.target.value)}>
            {TOUCHPOINTS.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Weight (kg)" error={error} htmlFor="wt">
          <Input id="wt" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
        <Field label="Event type" htmlFor="et">
          <Select id="et" value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option value="load">load</option>
            <option value="unload">unload</option>
            <option value="breakdown">breakdown</option>
            <option value="reroute">reroute</option>
          </Select>
        </Field>
        {ok && <p className="text-[13px] text-success num">{ok}</p>}
        <Button type="submit" loading={loading}>
          Submit event
        </Button>
      </form>

      <ConfirmModal
        open={confirm}
        title="Resubmit capacity event?"
        body="The previous submission was rejected. Resubmitting writes a new event to the ledger."
        confirmLabel="Resubmit"
        loading={loading}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void run()}
      />
    </Card>
  );
}
