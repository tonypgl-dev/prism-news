"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Eye,
  LayoutTemplate,
  Tag,
  Bell,
  ChevronRight,
  Sparkles,
  Languages,
  Type,
  Zap,
} from "lucide-react";
import { createPortal } from "react-dom";
import { DEFAULT_SETTINGS, type SettingsState } from "@/contexts/SettingsContext";
import { useSettings } from "@/hooks/useSettings";

// ----------------------------------------------------------------
// Tipuri
// ----------------------------------------------------------------

export type { SettingsState };
export { DEFAULT_SETTINGS };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
  onSettingsChange: (next: Partial<SettingsState>) => void;
}

export function SettingsPanel({ isOpen, onClose }: Pick<Props, "isOpen" | "onClose">) {
  const { settings, updateSettings } = useSettings();
  return <SettingsPanelInner isOpen={isOpen} onClose={onClose} settings={settings} onSettingsChange={updateSettings} />;
}

// ----------------------------------------------------------------
// Sub-componente UI
// ----------------------------------------------------------------

/** Toggle on/off cu animație internă */
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center
        rounded-full border-2 border-transparent transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950
        ${checked ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
          transition-transform duration-200
          ${checked ? "translate-x-4" : "translate-x-0"}
        `}
      />
    </button>
  );
}

/** Row de setare activă */
function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <Icon size={14} className="text-gray-500 dark:text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 mt-0.5">{children}</div>
    </div>
  );
}

/** Row de setare dezactivată (placeholder) */
function DisabledRow({
  icon: Icon,
  label,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 opacity-40 cursor-not-allowed">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <Icon size={14} className="text-gray-500 dark:text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            {badge}
          </span>
        )}
        <ChevronRight size={14} className="text-gray-400" />
      </div>
    </div>
  );
}

/** Segmented control generic */
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          role="radio"
          aria-checked={value === opt.key}
          onClick={() => onChange(opt.key)}
          className={`
            flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
            ${
              value === opt.key
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Secțiune cu titlu
// ----------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {title}
      </p>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
    </div>
  );
}

// ----------------------------------------------------------------
// Panoul principal
// ----------------------------------------------------------------

const PANEL_WIDTH = 360;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { x: PANEL_WIDTH, opacity: 0.6 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 320, damping: 32 },
  },
  exit: {
    x: PANEL_WIDTH,
    opacity: 0,
    transition: { duration: 0.22, ease: "easeIn" as const },
  },
};

function SettingsPanelInner({ isOpen, onClose, settings, onSettingsChange }: Props) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Montăm doar pe client (portal necesită document)
  useEffect(() => setMounted(true), []);

  // Focus pe butonul X la deschidere
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // Închide la Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Blochează scroll-ul body când panoul e deschis
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!mounted) return null;

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="settings-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Side sheet */}
          <motion.aside
            key="settings-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Setări experiență"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ width: PANEL_WIDTH, maxWidth: "100vw" }}
            className={`
              fixed right-0 top-0 bottom-0 z-[70]
              flex flex-col
              bg-white/90 dark:bg-[#0F1115]/95
              backdrop-blur-xl
              border-l border-gray-200 dark:border-gray-800
              shadow-2xl shadow-black/20
              overflow-hidden
            `}
          >
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                  <Sparkles size={13} className="text-white fill-white" />
                </div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                  Setări Experiență
                </h2>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Închide setările"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Conținut scrollabil ────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

              {/* Secțiunea: Afișare Spectru */}
              <Section title="Afișare Spectru">
                <SettingRow
                  icon={Tag}
                  label="Etichete de bias pe carduri"
                  description="Afișează insignele Stânga / Centru / Dreapta pe thumbnail-ul fiecărui articol."
                >
                  <Toggle
                    id="toggle-bias-labels"
                    checked={settings.showBiasLabels}
                    onChange={(v) => onSettingsChange({ showBiasLabels: v })}
                  />
                </SettingRow>
                <SettingRow
                  icon={Eye}
                  label="Bara Prism per subiect"
                  description="Afișează bara orizontală de distribuție politică deasupra fiecărui cluster."
                >
                  {/* Mereu activă în acest pas — placeholder vizual */}
                  <Toggle
                    id="toggle-prism-bar"
                    checked={true}
                    onChange={() => {}}
                  />
                </SettingRow>
                <SettingRow
                  icon={Languages}
                  label="Stil etichete"
                  description="Alege terminologia preferată pentru spectrul politic."
                >
                  <SegmentedControl
                    value={settings.labelStyle}
                    onChange={(v) => onSettingsChange({ labelStyle: v })}
                    options={[
                      { key: "political" as const, label: "Politic" },
                      { key: "descriptive" as const, label: "Descriptiv" },
                    ]}
                    ariaLabel="Stil etichete"
                  />
                </SettingRow>
                <SettingRow
                  icon={Zap}
                  label="Sinteză rapidă AI"
                  description="Afișează propoziția de impact generată de AI la expandarea cardului."
                >
                  <Toggle
                    id="toggle-ai-pre-summary"
                    checked={settings.showAiPreSummary}
                    onChange={(v) => onSettingsChange({ showAiPreSummary: v })}
                  />
                </SettingRow>
                <SettingRow
                  icon={Type}
                  label="Font titluri"
                  description="Serif pentru un look editorial clasic, Sans pentru modernitate."
                >
                  <SegmentedControl
                    value={settings.titleFont}
                    onChange={(v) => onSettingsChange({ titleFont: v })}
                    options={[
                      { key: "sans" as const, label: "Sans" },
                      { key: "serif" as const, label: "Serif" },
                    ]}
                    ariaLabel="Font titluri"
                  />
                </SettingRow>
              </Section>

              {/* Secțiunea: Mod Prismă */}
              <Section title="Mod Prismă">
                <div className="py-3 space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Alege densitatea vizualizării grilei de știri.
                  </p>
                  <SegmentedControl
                    value={settings.prismMode}
                    onChange={(v) => onSettingsChange({ prismMode: v })}
                    options={[
                      { key: "default" as const, label: "Implicit" },
                      { key: "compact" as const, label: "Compact" },
                    ]}
                    ariaLabel="Mod Prismă"
                  />
                  <SettingRow
                    icon={LayoutTemplate}
                    label="Modul selectat"
                    description={
                      settings.prismMode === "default"
                        ? "Carduri mari cu thumbnail și rezumat complet."
                        : "Carduri condensate, mai multe știri vizibile simultan."
                    }
                  >
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        settings.prismMode === "default"
                          ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {settings.prismMode === "default" ? "Implicit" : "Compact"}
                    </span>
                  </SettingRow>
                </div>
              </Section>

              {/* Separator vizual */}
              <div className="border-t border-gray-100 dark:border-gray-800 border-dashed" />

              {/* Secțiunea: Placeholder — Interese */}
              <Section title="Interese (Categorii)">
                <DisabledRow
                  icon={Sparkles}
                  label="Personalizează categoriile"
                  badge="Curând"
                />
                <p className="pb-2 text-xs text-gray-400 dark:text-gray-600 italic">
                  Selectează categoriile care te interesează pentru a personaliza feed-ul.
                </p>
              </Section>

              {/* Secțiunea: Placeholder — Notificări */}
              <Section title="Notificări Blindspot">
                <DisabledRow
                  icon={Bell}
                  label="Alertă unghi mort"
                  badge="Curând"
                />
                <p className="pb-2 text-xs text-gray-400 dark:text-gray-600 italic">
                  Primește notificări când un subiect important lipsește dintr-o perspectivă.
                </p>
              </Section>
            </div>

            {/* ── Footer ────────────────────────────────────────── */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50">
              <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
                Setările sunt salvate automat în browser.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
}
