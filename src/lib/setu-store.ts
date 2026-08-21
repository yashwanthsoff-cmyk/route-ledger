import { getSupabase } from "./supabase";

export type Role = "dispatcher" | "3pl" | "directorate";
export type Confidence = "high" | "medium" | "low";
export type EventType = "load" | "unload" | "breakdown" | "reroute" | "checkpoint";

export type Touchpoint = { id: string; name: string; seq: number; km: number };

export type Vehicle = {
  id: string;
  registration: string;
  rated_kg: number;
  current_touchpoint: string;
  capacity_pct: number;
  confidence: Confidence;
};

export type LegEvent = {
  id: string;
  vehicle_reg: string;
  touchpoint: string;
  event_type: EventType;
  weight_kg: number;
  capacity_pct: number;
  confidence_flag: Confidence;
  source: string;
  entered_by: string;
  ts: string;
  superseded: boolean;
};

export type Listing = {
  id: string;
  leg: string;
  vehicle_reg: string;
  tonnes: number;
  rate_per_tonne_km: number;
  km: number;
  status: "available" | "sold";
  buyer: string | null;
};

export type Prediction = {
  id: string;
  vehicle_reg: string;
  horizon_min: 15 | 30 | 60;
  predicted_pct: number;
  actual_pct: number | null;
  basis: string;
  factors: string[];
  created_at: string;
};

export type SetuState = {
  touchpoints: Touchpoint[];
  vehicles: Vehicle[];
  events: LegEvent[];
  listings: Listing[];
  predictions: Prediction[];
  resolved: Prediction[];
  lastChangedIds: string[];
};

const HOUR = 3600_000;
const base = Date.parse("2026-08-21T04:10:00.000Z");
const at = (mins: number) => new Date(base + mins * 60_000).toISOString();

export const TOUCHPOINTS: Touchpoint[] = [
  { id: "tp-1", name: "Ahmedabad", seq: 1, km: 0 },
  { id: "tp-2", name: "Palanpur", seq: 2, km: 142 },
  { id: "tp-3", name: "Sirohi", seq: 3, km: 268 },
  { id: "tp-4", name: "Ajmer", seq: 4, km: 462 },
  { id: "tp-5", name: "Jaipur", seq: 5, km: 597 },
];

function seed(): SetuState {
  const events: LegEvent[] = [
    ev("RJ14GA3821", "Ahmedabad", "load", 4200, 38, "high", "ULIP e-way bill", "dispatcher.ahd", 0),
    ev("RJ14GA3821", "Palanpur", "load", 6100, 55, "high", "Weighbridge", "dispatcher.ahd", 55),
    ev("RJ14GA3821", "Sirohi", "unload", 5200, 47, "medium", "Manual entry", "dispatcher.srh", 120),
    ev("RJ14GA3821", "Ajmer", "breakdown", 5200, 90, "low", "Driver report", "dispatcher.ajm", 168),
    ev("RJ14GA3821", "Ajmer", "reroute", 5200, 94, "medium", "Control room", "dispatcher.ajm", 182),
    ev("GJ01KL7742", "Ahmedabad", "load", 3100, 29, "high", "Weighbridge", "dispatcher.ahd", 12),
    ev("GJ01KL7742", "Palanpur", "load", 7400, 68, "high", "Weighbridge", "dispatcher.ahd", 74),
    ev("GJ01KL7742", "Sirohi", "checkpoint", 7400, 68, "medium", "GPS ping", "system", 140),
  ];

  return {
    touchpoints: TOUCHPOINTS,
    vehicles: [
      {
        id: "veh-1",
        registration: "RJ14GA3821",
        rated_kg: 12000,
        current_touchpoint: "Ajmer",
        capacity_pct: 94,
        confidence: "medium",
      },
      {
        id: "veh-2",
        registration: "GJ01KL7742",
        rated_kg: 11000,
        current_touchpoint: "Sirohi",
        capacity_pct: 68,
        confidence: "high",
      },
    ],
    events,
    listings: [
      L("lst-1", "Ajmer → Jaipur", "RJ14GA3821", 2, 12.5, 135, "available", null),
      L("lst-2", "Sirohi → Ajmer", "GJ01KL7742", 3.5, 11.2, 194, "available", null),
      L("lst-3", "Palanpur → Sirohi", "GJ01KL7742", 1.5, 13.4, 126, "sold", "Rajasthan Freight Co."),
      L("lst-4", "Ahmedabad → Palanpur", "RJ14GA3821", 4, 10.8, 142, "available", null),
    ],
    predictions: [
      P("pr-15", 15, 96, null, "Based on 3 pending load events and 1 scheduled unload.", [
        "Reroute added 32 km of collection stops",
        "Two consignments pending pickup at Ajmer hub",
        "Historical Ajmer→Jaipur fill rate: 91%",
      ]),
      P("pr-30", 30, 88, null, "Based on 1 confirmed 3PL allocation and 2 unload events.", [
        "2 tonnes allocated to 3PL partner on Ajmer→Jaipur",
        "Scheduled unload at Kishangarh checkpoint",
      ]),
      P("pr-60", 60, 74, null, "Based on projected unload sequence at Jaipur inbound.", [
        "Bulk mail unload scheduled on arrival",
        "No further pickups registered on this leg",
      ]),
    ],
    resolved: [
      P("pr-r1", 15, 55, 57, "Resolved", [], -3 * (HOUR / 60_000)),
      P("pr-r2", 30, 47, 44, "Resolved", [], -2.5 * (HOUR / 60_000)),
      P("pr-r3", 60, 90, 94, "Resolved", [], -2 * (HOUR / 60_000)),
      P("pr-r4", 15, 68, 68, "Resolved", [], -1 * (HOUR / 60_000)),
    ],
    lastChangedIds: [],
  };

  function ev(
    reg: string,
    tp: string,
    type: EventType,
    kg: number,
    pct: number,
    conf: Confidence,
    source: string,
    mins: number,
  ): LegEvent {
    return {
      id: `ev-${reg}-${mins}`,
      vehicle_reg: reg,
      touchpoint: tp,
      event_type: type,
      weight_kg: kg,
      capacity_pct: pct,
      confidence_flag: conf,
      source,
      entered_by: source === "system" ? "system" : source,
      ts: at(mins),
      superseded: false,
    };
  }

  function L(
    id: string,
    leg: string,
    reg: string,
    tonnes: number,
    rate: number,
    km: number,
    status: "available" | "sold",
    buyer: string | null,
  ): Listing {
    return { id, leg, vehicle_reg: reg, tonnes, rate_per_tonne_km: rate, km, status, buyer };
  }

  function P(
    id: string,
    horizon: 15 | 30 | 60,
    predicted: number,
    actual: number | null,
    basis: string,
    factors: string[],
    mins = 0,
  ): Prediction {
    return {
      id,
      vehicle_reg: "RJ14GA3821",
      horizon_min: horizon,
      predicted_pct: predicted,
      actual_pct: actual,
      basis,
      factors,
      created_at: at(mins),
    };
  }
}

let state: SetuState = seed();
const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set(next: Partial<SetuState>, changedIds: string[] = []) {
  state = { ...state, ...next, lastChangedIds: changedIds };
  listeners.forEach((l) => l());
}

export const priceOf = (l: Listing) => Math.round(l.rate_per_tonne_km * l.tonnes * l.km);

export function riskOf(pct: number): { level: "low" | "medium" | "high"; label: string } {
  if (pct >= 95) return { level: "high", label: "High risk" };
  if (pct >= 85) return { level: "medium", label: "Medium risk" };
  return { level: "low", label: "Low risk" };
}

/* ------------------------------------------------------------------ */
/* Edge Function calls — real invoke when connected, local demo when not */
/* ------------------------------------------------------------------ */

export type FnName =
  | "submit-capacity-event"
  | "override-capacity-event"
  | "confirm-booking"
  | "create-listing"
  | "get-ulip-contract-sample"
  | "simulate-forward-capacity"
  | "explain-prediction";

export async function invokeFunction<T = unknown>(
  name: FnName,
  body: Record<string, unknown>,
): Promise<T> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) {
      const detail = (data as { error?: string } | null)?.error;
      throw new Error(detail || error.message);
    }
    return data as T;
  }
  await new Promise((r) => setTimeout(r, 550));
  return localFunction(name, body) as T;
}

function localFunction(name: FnName, body: Record<string, unknown>): unknown {
  switch (name) {
    case "submit-capacity-event":
      return submitEventLocal(body);
    case "override-capacity-event":
      return overrideLocal(body);
    case "confirm-booking":
      return confirmBookingLocal(body);
    case "create-listing":
      return createListingLocal(body);
    case "get-ulip-contract-sample":
      return { ok: true };
    case "simulate-forward-capacity":
      return { predictions: state.predictions };
    case "explain-prediction": {
      const p = state.predictions.find((x) => x.id === body["prediction_id"]);
      return { factors: p?.factors ?? [] };
    }
  }
}

function submitEventLocal(body: Record<string, unknown>) {
  const reg = String(body["vehicle_reg"] ?? "");
  const touchpoint = String(body["touchpoint"] ?? "");
  const eventType = String(body["event_type"] ?? "") as EventType;
  const weight = Number(body["weight_kg"]);

  const vehicle = state.vehicles.find((v) => v.registration === reg);
  if (!vehicle) throw new Error(`Vehicle ${reg} is not assigned to this route.`);
  if (!touchpoint) throw new Error("Touchpoint is required for a capacity event.");
  if (!Number.isFinite(weight) || weight <= 0)
    throw new Error("Weight must be a positive number of kilograms.");
  if (weight > vehicle.rated_kg)
    throw new Error(
      `Weight ${weight.toLocaleString("en-IN")} kg exceeds the rated capacity of ${vehicle.rated_kg.toLocaleString("en-IN")} kg for ${reg}.`,
    );

  const pct = Math.round((weight / vehicle.rated_kg) * 100);
  const event: LegEvent = {
    id: `ev-${Date.now()}`,
    vehicle_reg: reg,
    touchpoint,
    event_type: eventType || "load",
    weight_kg: weight,
    capacity_pct: pct,
    confidence_flag: "high",
    source: "Manual entry",
    entered_by: "judge.demo",
    ts: new Date().toISOString(),
    superseded: false,
  };

  const vehicles = state.vehicles.map((v) =>
    v.registration === reg
      ? { ...v, capacity_pct: pct, confidence: "high" as Confidence, current_touchpoint: touchpoint }
      : v,
  );
  const predictions = state.predictions.map((p) => ({
    ...p,
    predicted_pct: Math.max(5, Math.min(99, pct + (p.horizon_min === 15 ? 4 : p.horizon_min === 30 ? -4 : -18))),
  }));

  set({ events: [...state.events, event], vehicles, predictions }, [vehicle.id, ...predictions.map((p) => p.id)]);
  return { event, previous_pct: vehicle.capacity_pct, new_pct: pct };
}

function overrideLocal(body: Record<string, unknown>) {
  const reg = String(body["vehicle_reg"] ?? "");
  const newPct = Number(body["capacity_pct"]);
  const vehicle = state.vehicles.find((v) => v.registration === reg);
  if (!vehicle) throw new Error(`Vehicle ${reg} not found.`);
  if (!Number.isFinite(newPct) || newPct < 0 || newPct > 100)
    throw new Error("Override percentage must be between 0 and 100.");

  const events = state.events.map((e) =>
    e.vehicle_reg === reg && !e.superseded && e.touchpoint === vehicle.current_touchpoint
      ? { ...e, superseded: true }
      : e,
  );
  const event: LegEvent = {
    id: `ev-ovr-${Date.now()}`,
    vehicle_reg: reg,
    touchpoint: vehicle.current_touchpoint,
    event_type: "checkpoint",
    weight_kg: Math.round((newPct / 100) * vehicle.rated_kg),
    capacity_pct: newPct,
    confidence_flag: "high",
    source: "Supervisor override",
    entered_by: "directorate.ops",
    ts: new Date().toISOString(),
    superseded: false,
  };
  const before = vehicle.capacity_pct;
  set(
    {
      events: [...events, event],
      vehicles: state.vehicles.map((v) =>
        v.registration === reg ? { ...v, capacity_pct: newPct, confidence: "high" } : v,
      ),
    },
    [vehicle.id],
  );
  return { touchpoint: vehicle.current_touchpoint, before, after: newPct };
}

function confirmBookingLocal(body: Record<string, unknown>) {
  const id = String(body["listing_id"] ?? "");
  const listing = state.listings.find((l) => l.id === id);
  if (!listing) throw new Error("Listing no longer exists.");
  if (listing.status === "sold") throw new Error("Already allocated to another partner.");
  const buyer = String(body["buyer"] ?? "Rajasthan Freight Co.");
  set(
    {
      listings: state.listings.map((l) => (l.id === id ? { ...l, status: "sold", buyer } : l)),
    },
    [id],
  );
  return { booking_id: `bk-${Date.now()}`, listing_id: id, amount: priceOf(listing), buyer };
}

function createListingLocal(body: Record<string, unknown>) {
  const tonnes = Number(body["tonnes"]);
  if (!Number.isFinite(tonnes) || tonnes <= 0) throw new Error("Spare tonnage must be greater than 0.");
  const listing: Listing = {
    id: `lst-${Date.now()}`,
    leg: String(body["leg"] ?? "Ajmer → Jaipur"),
    vehicle_reg: String(body["vehicle_reg"] ?? "RJ14GA3821"),
    tonnes,
    rate_per_tonne_km: Number(body["rate_per_tonne_km"] ?? 12.5),
    km: Number(body["km"] ?? 135),
    status: "available",
    buyer: null,
  };
  set({ listings: [listing, ...state.listings] }, [listing.id]);
  return { listing };
}

/** Seeded breakdown scenario used by the Digital Twin replay. */
export function replayEventsFor(reg: string) {
  return state.events
    .filter((e) => e.vehicle_reg === reg)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
}
