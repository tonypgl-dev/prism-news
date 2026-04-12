"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { SlidersHorizontal, Mail, X, Send, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { BreakingTicker } from "./BreakingTicker";
import { SettingsPanel } from "./SettingsPanel";
import { VisitorCounter } from "./VisitorCounter";
import { BREAKING_NEWS } from "@/lib/mock-data";

interface HeaderProps {
  tickerItems?: string[];
  /** Dată afișată în bara de jos a navbar-ului (ex. ro-RO). */
  dateLabel?: string;
  /** Implicit true. Setează false pe paginile editoriale unde navbar-ul nu trebuie sticky. */
  sticky?: boolean;
}

// ── Modal Contact ─────────────────────────────────────────────────────────────

function ContactModal({ anchorRef, onClose }: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Închide la click în afara modalului
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorRef, onClose]);

  // Închide la Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !message) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Eroare la trimitere. Încearcă din nou.");
      } else {
        setSent(true);
        setTimeout(onClose, 2000);
      }
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Contact"
      className="absolute right-0 top-full mt-2 z-[80] w-80
                 bg-white dark:bg-gray-950
                 border border-gray-200 dark:border-gray-800
                 rounded-sm shadow-2xl shadow-black/20
                 p-4"
    >
      {/* Header modal */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start gap-2 min-w-0 flex-1 pr-2">
          <Mail size={14} className="text-slate-900 dark:text-white shrink-0 mt-0.5" />
          <span className="text-[10px] font-bold leading-snug text-slate-900 dark:text-white">
            Pentru orice întrebare scrie-ne un mesaj și îți vom răspunde îndată.
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label="Închide"
        >
          <X size={14} />
        </button>
      </div>

      {sent ? (
        <div className="py-4 text-center text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">
          ✓ Mesaj trimis
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Adresa ta de e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-[11px] font-semibold rounded-sm border border-gray-200 dark:border-gray-800
                       bg-white dark:bg-gray-900 text-slate-900 dark:text-white
                       placeholder-slate-300 dark:placeholder-gray-600
                       focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
          />
          <textarea
            required
            placeholder="Mesajul tău…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-[11px] font-semibold rounded-sm border border-gray-200 dark:border-gray-800
                       bg-white dark:bg-gray-900 text-slate-900 dark:text-white
                       placeholder-slate-300 dark:placeholder-gray-600
                       focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors
                       resize-none"
          />
          {error && (
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all rounded-sm"
          >
            <Send size={12} />
            {loading ? "Se trimite…" : "Trimite mesajul"}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

type LogoLightPhase = "plain" | "beam" | "complete";

const LOGO_PLAIN_MS = 220;
/** de la start fază beam: delay 60ms + durată 880ms (globals.css) */
const LOGO_BEAM_ANIM_MS = 60 + 880;
const LOGO_BEAM_END_BUFFER_MS = 45;

export function Header({ tickerItems, dateLabel, sticky = true }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { settings } = useSettings();
  const searchShellRef = useRef<HTMLDivElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    if (!searchOpen) return;
    function handlePointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (searchShellRef.current?.contains(t)) return;
      if (searchToggleRef.current?.contains(t)) return;
      setSearchOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [searchOpen]);

  const [logoLightPhase, setLogoLightPhase] = useState<LogoLightPhase>("plain");
  const [beamAnimKey, setBeamAnimKey] = useState(0);
  const logoLightTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearLogoLightTimeouts = useCallback(() => {
    logoLightTimeoutsRef.current.forEach(clearTimeout);
    logoLightTimeoutsRef.current = [];
  }, []);

  const runLogoLightSequence = useCallback(() => {
    clearLogoLightTimeouts();
    setLogoLightPhase("plain");
    setBeamAnimKey((k) => k + 1);

    logoLightTimeoutsRef.current.push(
      setTimeout(() => {
        setLogoLightPhase("beam");
      }, LOGO_PLAIN_MS)
    );

    logoLightTimeoutsRef.current.push(
      setTimeout(() => {
        setLogoLightPhase("complete");
      }, LOGO_PLAIN_MS + LOGO_BEAM_ANIM_MS + LOGO_BEAM_END_BUFFER_MS)
    );
  }, [clearLogoLightTimeouts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLogoLightPhase("complete");
      return undefined;
    }
    runLogoLightSequence();
    return () => clearLogoLightTimeouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- secvență doar la mount (și Strict Mode cleanup)
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const contactBtnRef = useRef<HTMLButtonElement>(null);

  const showCodeRayEffects = logoLightPhase === "complete";

  return (
    <>
      <header
        className={`${sticky ? "sticky top-0 z-50" : "relative"} w-full border-b border-gray-200 dark:border-gray-800 overflow-visible
          bg-gradient-to-r from-slate-600 from-0% via-slate-300 via-[26%] to-white to-[62%]
          dark:bg-gray-950 dark:bg-none`}
      >
        <div className="max-w-screen-xl mx-auto px-4">
        <div className="relative flex flex-col py-2 md:py-0 md:h-32 overflow-visible">
        <div className="relative flex flex-1 items-stretch justify-between gap-3 md:gap-4 min-h-0 overflow-visible">
          
          {/* Logo & Brand — secvență: logo simplu → fascicul conic → efecte raze (flare) */}
          <Link
            href="/"
            prefetch
            className="relative shrink-0 inline-block logo-scale-mobile isolate max-sm:-ml-[30px] self-center md:[transform:translate3d(0,0,0)]"
            onClick={(e) => {
              e.preventDefault();
              if (isHome) {
                runLogoLightSequence();
                router.refresh();
              } else {
                router.push("/");
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logomod.png" alt="Prisma News" style={{ height: "100px", width: "auto", display: "block" }} />
            {/* Fascicul conic: vizibil doar în fazele beam + complete */}
            <div
              className={`absolute inset-0 z-[1] pointer-events-none overflow-visible transition-opacity duration-200 ${
                logoLightPhase === "plain" ? "opacity-0" : "opacity-100"
              }`}
            >
              <div
                className="pointer-events-none"
                style={{
                  position: "absolute",
                  left: "calc(38% - 1px)",
                  marginLeft: "-58px",
                  width: "58px",
                  top: "calc(42% + 10px)",
                  height: "26px",
                  transform: "translate(0, -50%) rotate(-11deg)",
                  transformOrigin: "100% 50%",
                }}
              >
                {logoLightPhase === "beam" && (
                  <div
                    key={beamAnimKey}
                    className="logo-ray-reveal-sheath logo-ray-reveal-sheath--animate"
                  >
                    <div className="logo-ray-taper-body" aria-hidden />
                  </div>
                )}
                {logoLightPhase === "complete" && (
                  <div className="logo-ray-reveal-sheath logo-ray-reveal-sheath--done">
                    <div className="logo-ray-taper-body" aria-hidden />
                  </div>
                )}
              </div>
            </div>
            <div
              className={`absolute pointer-events-none z-[1] transition-opacity duration-500 ${
                showCodeRayEffects ? "opacity-100" : "opacity-0"
              }`}
              style={{ left: "calc(38% - 1px)", top: "calc(42% + 10px)" }}
            >
              <div style={{ position:"absolute", transform:"translate(-50%,-50%)", width:"1px", height:"100px", background:"linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 70%, transparent 100%)", filter:"blur(0.5px)" }} />
              <div style={{ position:"absolute", transform:"translate(-50%,-50%)", width:"120px", height:"120px", borderRadius:"50%", background:"radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.03) 50%, transparent 65%)", filter:"blur(8px)" }} />
              <div style={{ position:"absolute", transform:"translate(-50%,-50%)", width:"32px", height:"32px", borderRadius:"50%", background:"radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)", filter:"blur(5px)" }} />
              <div style={{ position:"absolute", transform:"translate(-50%,-50%)", width:"3px", height:"3px", borderRadius:"50%", background:"white", boxShadow:"0 0 3px 1px rgba(255,255,255,0.8)" }} />
            </div>
            {/* Text: perspective în același transform ca rotateY — evită artefacte la scroll cu sticky */}
            <div
              className="absolute pointer-events-none z-[2] mix-blend-multiply dark:mix-blend-soft-light [transform:translateZ(0)]"
              style={{ top: "-6px", right: "6px" }}
            >
              <span
                className="font-black uppercase tracking-tight"
                style={{
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "78px",
                  lineHeight: 1,
                  background: "linear-gradient(to right, rgba(26, 58, 92, 0.78), rgba(58, 159, 212, 0.78))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  transform: "perspective(200px) rotateY(-38deg) rotate(2deg)",
                  transformOrigin: "right center",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  display: "inline-block",
                }}
              >
                PRISMA
              </span>
            </div>
            <div
              className="absolute pointer-events-none z-[10] [transform:translateZ(0)]"
              style={{ top: "40px", right: "7px" }}
            >
              <span
                className="text-[36px] font-black uppercase tracking-tight"
                style={{
                  fontFamily: "var(--font-barlow), sans-serif",
                  lineHeight: 1,
                  color: "#8fa3b1",
                  transform: "perspective(100px) scaleX(1.12) scaleY(0.88) rotateY(-38deg) rotate(10deg)",
                  transformOrigin: "right center",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  display: "inline-block",
                  textShadow: "-2px -2px 0 rgba(0,0,0,0.75), 2px -2px 0 rgba(0,0,0,0.75), -2px 2px 0 rgba(0,0,0,0.75), 2px 2px 0 rgba(0,0,0,0.75), -2px 0 0 rgba(0,0,0,0.75), 2px 0 0 rgba(0,0,0,0.75), 0 -2px 0 rgba(0,0,0,0.75), 0 2px 0 rgba(0,0,0,0.75)",
                }}
              >
                NEWS
              </span>
            </div>
            {/* PRISMA inversat — doar peste pixelii opaci ai logo (mască = alfa PNG) */}
            <div
              className="absolute inset-0 z-[3] pointer-events-none"
              style={{
                WebkitMaskImage: "url(/logomod.png)",
                maskImage: "url(/logomod.png)",
                WebkitMaskSize: "auto 100%",
                maskSize: "auto 100%",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "left center",
                maskPosition: "left center",
              }}
            >
              <div
                className="absolute pointer-events-none [transform:translateZ(0)]"
                style={{ top: "-6px", right: "6px" }}
              >
                <span
                  className="font-black uppercase tracking-tight"
                  style={{
                    fontFamily: "var(--font-barlow), sans-serif",
                    fontSize: "78px",
                    lineHeight: 1,
                    background: "linear-gradient(to right, rgba(26, 58, 92, 0.78), rgba(58, 159, 212, 0.78))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    transform: "perspective(200px) rotateY(-38deg) rotate(2deg)",
                    transformOrigin: "right center",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    display: "inline-block",
                    filter: "invert(1)",
                  }}
                >
                  PRISMA
                </span>
              </div>
            </div>
          </Link>

          {/* Dreapta: acțiuni sus, dată jos în același colț */}
          <div className="ml-auto flex min-w-0 flex-col items-end justify-between gap-2 shrink-0 py-0.5 md:py-3 self-stretch">
            <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
              <AnimatePresence mode="sync">
                {searchOpen && (
                  <motion.div
                    key="header-search-shell"
                    ref={searchShellRef}
                    id="header-search-panel"
                    role="search"
                    initial={{ scaleX: 0.08, opacity: 0, y: "-50%" }}
                    animate={{ scaleX: 1, opacity: 1, y: "-50%" }}
                    exit={{ scaleX: 0.08, opacity: 0, y: "-50%" }}
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.85 }}
                    style={{
                      transformOrigin: "right center",
                      top: "50%",
                      right: "100%",
                      marginRight: "0.375rem",
                      position: "absolute",
                    }}
                    className="z-[60] flex min-w-0 justify-end will-change-transform pointer-events-auto w-[min(9rem,calc(50vw-2.25rem))] sm:w-[min(18rem,calc(100vw-4.5rem))]"
                  >
                    <div
                      className="w-full min-w-0 rounded-full border border-zinc-300/55 bg-white/88 px-1.5 py-0.5 backdrop-blur-md
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_1px_rgba(15,23,42,0.05),0_3px_10px_rgba(15,23,42,0.08)]
                        dark:border-zinc-600/50 dark:bg-zinc-900/88
                        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.45),0_4px_14px_rgba(0,0,0,0.35)]"
                    >
                      <SearchBar
                        autoFocus
                        embedded
                        onRequestClose={closeSearch}
                        className="w-full"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                ref={searchToggleRef}
                type="button"
                id="header-search-toggle"
                aria-expanded={searchOpen}
                aria-controls="header-search-panel"
                onClick={() => setSearchOpen((v) => !v)}
                className="shrink-0 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                title={searchOpen ? "Închide căutarea" : "Caută"}
                aria-label={searchOpen ? "Închide căutarea" : "Deschide căutarea"}
              >
                {searchOpen ? <X size={18} strokeWidth={2.25} /> : <Search size={18} />}
              </button>
              <ThemeToggle />

              <button
                ref={contactBtnRef}
                onClick={() => setContactOpen((v) => !v)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Contact"
              >
                <Mail size={18} />
              </button>

              <button
                onClick={openSettings}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Settings"
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>

            <div className="flex flex-col items-end gap-0.5">
              {dateLabel ? (
                <p
                  className="text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide text-right max-w-[min(100%,11rem)] leading-snug"
                  suppressHydrationWarning
                >
                  {dateLabel}
                </p>
              ) : null}
              <VisitorCounter />
            </div>
          </div>

          {contactOpen && (
            <ContactModal
              anchorRef={contactBtnRef}
              onClose={() => setContactOpen(false)}
            />
          )}
        </div>
        </div>
        </div>
      </header>

      {settings.showBreakingTicker && (
        <BreakingTicker items={tickerItems && tickerItems.length > 0 ? tickerItems : BREAKING_NEWS} />
      )}

      <SettingsPanel isOpen={settingsOpen} onClose={closeSettings} />
    </>
  );
}
