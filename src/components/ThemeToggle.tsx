"use client";

import { useLayoutEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/** Implicit: dark pentru toți; light doar dacă utilizatorul a ales explicit (localStorage theme === "light"). */
export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useLayoutEffect(() => {
    const isLight = localStorage.getItem("theme") === "light";
    const isDark = !isLight;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Comută tema"
      className="flex items-center justify-center w-8 h-8 rounded-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      {dark ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}
