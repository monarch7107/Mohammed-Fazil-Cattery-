"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { catSignals } from "@/components/cat/catSignals";
import { CatFallback } from "@/components/cat/CatFallback";
import dynamic from "next/dynamic";

const IntroCatScene = dynamic(() => import("@/components/cat/CatScene"), {
  ssr: false,
  loading: () => <CatFallback className="opacity-60" />,
});

const STORAGE_KEY = "mfc:intro:v1";
const INTRO_MS = 2800;
const FADE_MS = 550;

type IntroPhase = "hidden" | "playing" | "leaving";

interface IntroContextValue {
  phase: IntroPhase;
  /** True while the opening experience owns the screen. */
  visible: boolean;
  skip: () => void;
}

const IntroContext = createContext<IntroContextValue>({
  phase: "hidden",
  visible: false,
  skip: () => undefined,
});

export function useIntro() {
  return useContext(IntroContext);
}

/**
 * Premium opening experience (~2.8s):
 * cream field → drifting paw prints → the cat breathes and blinks →
 * the wordmark resolves → smooth hand-off to the floating companion.
 * Skippable, once per session, and skipped entirely for reduced motion.
 */
export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>("hidden");
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    if (reduced || seen) {
      setPhase("hidden");
      catSignals.introActive = false;
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    setShouldPlay(true);
    setPhase("playing");
    catSignals.introActive = true;
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const scrollLock = window.setTimeout(() => {
      document.body.style.overflow = "hidden";
    }, 0);
    const finish = window.setTimeout(() => setPhase("leaving"), INTRO_MS);
    return () => {
      window.clearTimeout(scrollLock);
      window.clearTimeout(finish);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const done = window.setTimeout(() => {
      setPhase("hidden");
      catSignals.introActive = false;
      document.body.style.overflow = "";
    }, FADE_MS);
    return () => {
      window.clearTimeout(done);
      document.body.style.overflow = "";
    };
  }, [phase]);

  const skip = useCallback(() => {
    setPhase("leaving");
  }, []);

  // Keyboard escape hatch
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, skip]);

  const value = useMemo<IntroContextValue>(
    () => ({ phase, visible: phase !== "hidden", skip }),
    [phase, skip]
  );

  const playing = phase === "playing";
  const leaving = phase === "leaving";

  return (
    <IntroContext.Provider value={value}>
      {children}
      {phase !== "hidden" && (
        <div
          className={`fixed inset-0 z-[120] flex flex-col items-center justify-center bg-cream transition-opacity duration-500 ease-editorial ${
            leaving ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          role="dialog"
          aria-label="Mohammed Fazil Cattery introduction"
          aria-modal="true"
        >
          {/* Very subtle paw prints */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {[
              { left: "12%", top: "22%", delay: "0.1s", size: 46, rotate: -18 },
              { left: "78%", top: "16%", delay: "0.55s", size: 38, rotate: 22 },
              { left: "64%", top: "72%", delay: "0.95s", size: 42, rotate: -8 },
              { left: "24%", top: "76%", delay: "1.3s", size: 34, rotate: 14 },
            ].map((paw, index) => (
              <svg
                key={index}
                viewBox="0 0 64 64"
                className={`absolute text-navy/10 ${playing ? "animate-[paw-drift_3.4s_ease-in-out_infinite]" : ""}`}
                style={{
                  left: paw.left,
                  top: paw.top,
                  width: paw.size,
                  height: paw.size,
                  transform: `rotate(${paw.rotate}deg)`,
                  animationDelay: paw.delay,
                }}
                aria-hidden="true"
              >
                <g fill="currentColor">
                  <ellipse cx="32" cy="40" rx="15" ry="12" />
                  <ellipse cx="14" cy="24" rx="6.5" ry="8" />
                  <ellipse cx="27" cy="16" rx="6" ry="8" />
                  <ellipse cx="41" cy="16" rx="6" ry="8" />
                  <ellipse cx="52" cy="25" rx="6" ry="7.5" />
                </g>
              </svg>
            ))}
          </div>

          {/* Cat */}
          <div
            className={`relative z-10 h-52 w-52 transition-all duration-700 ease-editorial sm:h-72 sm:w-72 ${
              playing ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
            }`}
            style={{ animationDelay: "0.25s" }}
            aria-hidden="true"
          >
            <IntroCatScene quality="high" />
          </div>

          {/* Branding */}
          <div className="relative z-10 mt-6 flex flex-col items-center px-6 text-center">
            <p
              className={`eyebrow text-navy/50 transition-all duration-700 ease-editorial ${
                playing ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
              }`}
              style={{ transitionDelay: "0.15s" }}
            >
              Est. in Madurai
            </p>
            <h1
              className={`mt-3 max-w-[16ch] text-display-md text-navy transition-all duration-700 ease-editorial sm:text-display-lg ${
                playing ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: "0.45s" }}
            >
              Mohammed Fazil Cattery
            </h1>
            <p
              className={`mt-4 text-[13px] font-semibold uppercase tracking-editorial text-brown transition-all duration-700 ease-editorial ${
                playing ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: "0.8s" }}
            >
              Persian Kittens • Pet Food • Madurai
            </p>
            <div
              className={`mt-8 h-px w-40 origin-left bg-navy/25 transition-transform duration-1000 ease-editorial ${
                playing ? "scale-x-100" : "scale-x-0"
              }`}
              style={{ transitionDelay: "0.9s" }}
              aria-hidden="true"
            />
          </div>

          <button
            type="button"
            onClick={skip}
            className="absolute right-4 top-4 z-20 rounded-full border border-navy/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider2 text-navy/70 transition hover:border-navy/50 hover:text-navy sm:right-8 sm:top-8"
          >
            Skip
          </button>
        </div>
      )}
    </IntroContext.Provider>
  );
}
