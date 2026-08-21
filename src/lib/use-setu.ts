import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getState, subscribe, type SetuState } from "./setu-store";

export function useSetu(): SetuState {
  return useSyncExternalStore(
    (cb) => {
      const unsub = subscribe(cb);
      return () => {
        unsub();
      };
    },
    getState,
    getState,
  );
}

/** Returns true for ~800ms whenever `value` changes, to drive the live-update highlight. */
export function useLiveHighlight(value: unknown) {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  const prev = useRef(value);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      prev.current = value;
      return;
    }
    if (prev.current === value) return;
    prev.current = value;
    setOn(true);
    const t = setTimeout(() => setOn(false), 800);
    return () => clearTimeout(t);
  }, [value]);

  return on;
}

/** Simulated data-view lifecycle so every screen shows a real skeleton pass. */
export function useLoadingPass(ms = 650) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
