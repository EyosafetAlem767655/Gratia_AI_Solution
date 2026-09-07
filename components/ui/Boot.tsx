"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/ui/Logo";

const WEIGHTS = { fonts: 0.1, video: 0.7, data: 0.1, images: 0.1 };
type Signal = keyof typeof WEIGHTS;
const ALL: Signal[] = ["fonts", "video", "data", "images"];
type BootValue = {
  booted: boolean;
  prepared: boolean;
  failed: boolean;
  reportProgress: (signal: Signal, progress: number) => void;
  reportVideoReady: () => void;
  reportDataReady: () => void;
  fail: (message: string) => void;
  setStartAnimation: (action: (() => void) | null) => void;
};
const BootContext = createContext<BootValue>({
  booted: true, prepared: true, failed: false, reportProgress: () => {},
  reportVideoReady: () => {}, reportDataReady: () => {}, fail: () => {}, setStartAnimation: () => {},
});
export const useBoot = () => useContext(BootContext);

export function BootProvider({ children, expects = ALL }: { children: React.ReactNode; expects?: Signal[] }) {
  const [attempt, setAttempt] = useState(0);
  return <BootSession key={attempt} expects={expects} retry={() => setAttempt(n => n + 1)}>{children}</BootSession>;
}

function BootSession({ children, expects, retry }: { children: React.ReactNode; expects: Signal[]; retry: () => void }) {
  const [booted, setBooted] = useState(false);
  const [values, setValues] = useState({ fonts: 0, video: 0, data: 0, images: 0 });
  const [error, setError] = useState<string | null>(null);
  const [startAnimation, setAction] = useState<(() => void) | null>(null);
  const latest = useRef(values);
  const expectedKey = expects.join(",");
  const activity = useRef<Partial<Record<Signal, number>>>({});
  const reportProgress = useCallback((signal: Signal, progress: number) => {
    activity.current[signal] = Date.now();
    latest.current = { ...latest.current, [signal]: Math.max(latest.current[signal], Math.min(1, progress)) };
    setValues(latest.current);
  }, []);
  const fail = useCallback((message: string) => setError(previous => previous ?? message), []);
  const setStartAnimation = useCallback((action: (() => void) | null) => setAction(() => action), []);
  const reportVideoReady = useCallback(() => reportProgress("video", 1), [reportProgress]);
  const reportDataReady = useCallback(() => reportProgress("data", 1), [reportProgress]);
  const prepared = expects.every(key => values[key] >= (key === "video" ? 0.99 : 1));
  const complete = expects.every(key => values[key] === 1);
  const total = expects.reduce((sum, key) => sum + WEIGHTS[key], 0) || 1;
  const progress = expects.reduce((sum, key) => sum + values[key] * WEIGHTS[key], 0) / total;

  useEffect(() => {
    let active = true;
    document.documentElement.classList.toggle("no-motion", matchMedia("(prefers-reduced-motion: reduce)").matches);
    document.fonts.ready.then(() => {
      if (!active) return;
      if ([...document.fonts].some(font => font.status === "error")) fail("Fonts could not load. Please retry.");
      else reportProgress("fonts", 1);
    }).catch(() => { if (active) fail("Fonts could not load. Please retry."); });
    return () => { active = false; };
  }, [reportProgress, fail]);

  useEffect(() => {
    if (booted || error) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const stalled = (expectedKey.split(",") as Signal[]).find(key => {
        if (latest.current[key] === 1) return false;
        // Images depend on data; decoded video waits for the other assets.
        if (key === "images" && latest.current.data < 1) return false;
        if (key === "video" && latest.current.video >= 0.99) return false;
        return Date.now() - (activity.current[key] ?? (key === "images" ? activity.current.data : undefined) ?? started) >= 30_000;
      });
      if (stalled) fail("Loading stopped responding. Check your connection and retry.");
    }, 1000);
    return () => clearInterval(timer);
  }, [booted, error, expectedKey, fail]);

  useEffect(() => {
    if (!complete || error) return;
    const timer = window.setTimeout(() => setBooted(true), 260);
    return () => clearTimeout(timer);
  }, [complete, error]);

  useEffect(() => {
    if (booted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [booted]);

  const value = useMemo(() => ({ booted, prepared, failed: !!error, reportProgress, reportVideoReady, reportDataReady, fail, setStartAnimation }),
    [booted, prepared, error, reportProgress, reportVideoReady, reportDataReady, fail, setStartAnimation]);
  return <BootContext.Provider value={value}>
    <div inert={!booted} data-page-ready={booted}>{children}</div>
    <div data-boot-veil data-done={booted} aria-hidden={booted} inert={booted}>
      <div className="flex w-64 flex-col items-center gap-6 text-center">
        <LogoMark className="h-10 w-10 text-white" />
        <div className="h-px w-full overflow-hidden bg-white/15" role="progressbar" aria-label="Loading" aria-valuenow={Math.floor(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full origin-left bg-white transition-transform duration-300" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <span className="text-xs tabular-nums text-white/70">{Math.floor(progress * 100)}%</span>
        {error ? <><p role="alert" className="text-sm">{error}</p><button className="btn-cta rounded-full px-6 py-3" onClick={retry}>Retry loading</button></> : startAnimation ? <button className="btn-cta rounded-full px-6 py-3" onClick={startAnimation}>Start animation</button> : <p role="status" className="text-sm text-white/70">Preparing your experience…</p>}
      </div>
    </div>
  </BootContext.Provider>;
}
