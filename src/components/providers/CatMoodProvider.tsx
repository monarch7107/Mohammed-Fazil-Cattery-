"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { catSignals, type CatMood } from "@/components/cat/catSignals";

interface CatContextValue {
  /** True when the current route should not show the companion (admin). */
  hidden: boolean;
  /** Pause reactions while a dialog/lightbox is open. */
  setPaused: (paused: boolean) => void;
}

const CatContext = createContext<CatContextValue>({
  hidden: false,
  setPaused: () => undefined,
});

export function useCat() {
  return useContext(CatContext);
}

/**
 * Section awareness: sections declare `data-cat-mood="curious"` and the
 * companion subtly changes how it behaves. Purely signal-based, so scrolling
 * never re-renders the tree.
 */
export function CatMoodProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(pathname.startsWith("/admin"));
  }, [pathname]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-cat-mood]"));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const mood = visible.target.getAttribute("data-cat-mood") as CatMood | null;
          if (mood) catSignals.mood = mood;
        }
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-10% 0px -20% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  const value = useMemo<CatContextValue>(
    () => ({
      hidden,
      setPaused: (paused: boolean) => {
        catSignals.paused = paused;
      },
    }),
    [hidden]
  );

  return <CatContext.Provider value={value}>{children}</CatContext.Provider>;
}
