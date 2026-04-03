"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Bias } from "@/types";

export interface SettingsState {
  labelStyle: "political" | "descriptive";
  showBiasLabels: boolean;
  prismMode: "default" | "compact";
  titleFont: "sans" | "serif";
  showAiPreSummary: boolean;
}

export const DEFAULT_SETTINGS: SettingsState = {
  labelStyle: "political",
  showBiasLabels: true,
  prismMode: "default",
  titleFont: "sans",
  showAiPreSummary: true,
};

const LABEL_MAPS: Record<SettingsState["labelStyle"], Record<Bias, string>> = {
  political:   { left: "Stânga",     center: "Centru",      right: "Dreapta"      },
  descriptive: { left: "Progresist", center: "Echilibrat",  right: "Conservator"  },
};

interface SettingsContextValue {
  settings: SettingsState;
  updateSettings: (patch: Partial<SettingsState>) => void;
  biasLabels: Record<Bias, string>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("prism-settings");
      if (stored) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {
      // ignore
    }
  }, []);

  function updateSettings(patch: Partial<SettingsState>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem("prism-settings", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const biasLabels = LABEL_MAPS[settings.labelStyle];

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, biasLabels }}>
      {children}
    </SettingsContext.Provider>
  );
}

export { SettingsContext };
