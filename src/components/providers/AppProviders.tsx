"use client";

import { CatMoodProvider, useCat } from "./CatMoodProvider";
import { IntroProvider, useIntro } from "./IntroProvider";
import { CatCompanion } from "@/components/cat/CatCompanion";

function CompanionLayer() {
  const { hidden } = useCat();
  const { visible: introVisible } = useIntro();
  return <CatCompanion visible={!hidden && !introVisible} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatMoodProvider>
      <IntroProvider>
        {children}
        <CompanionLayer />
      </IntroProvider>
    </CatMoodProvider>
  );
}
