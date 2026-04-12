# Reguli pentru Agenți: Prism News (Next.js 15)

## 1. Standarde de Cod (Obligatorii)
*   **Next.js 15:** Suntem pe App Router. Atenție la `async` params în rute și la noile convenții de caching.
*   **State Management:** NU folosiți `useState` local pentru preferințe globale. Utilizați exclusiv hook-ul `useSettings()` din `SettingsContext`.
*   **Culori:** Nu hardcodati culori hex în componente. Folosiți clasele Tailwind care respectă design system-ul (ex: `text-slate-500` pentru centru, `text-blue-600` pentru stânga).
*   **Accesibilitate:** Orice modal sau panel nou trebuie să folosească `createPortal` și să asigure focus trap + închidere pe Escape.

## 2. Convenții Vizuale (Prism News Style)
*   **Tipografie:** Folosiți variabila CSS `--font-playfair` pentru titluri de știri când setarea `font` este `serif`.
*   **Animații:** Utilizați `Framer Motion` cu `spring` pentru elemente de UI și `ease-out` pentru tranziții de pagină.
*   **Dark Mode:** Fundalul default este `#0F1115`. Nu folosiți negru pur (`#000`) decât pentru text extrem de contrastant.

## 3. Logica Freemium
*   Verificați mereu flag-ul `isPremium` din Context înainte de a randa funcții analitice (AlignedGrid, filtre avansate).
*   Funcțiile blocate pentru utilizatorii gratuiți după 3 zile trebuie să afișeze un indicator vizual discret (iconiță `Lock`).

## 4. Structura Proiectului
*   `src/components`: Componente atomice (butoane, carduri).
*   `src/contexts`: Settings, Auth (viitor).
*   `src/hooks`: useSettings, useFreemium.
*   `src/lib`: utils.ts (BIAS_COLORS, BIAS_LABELS), supabase.ts.

## 5. Publicare Articole Editoriale
Pentru a posta un articol editorial original (din HTML furnizat de utilizator),
urmează instrucțiunile din **`postarestire.md`** — inclusiv categorii, clase HTML
suportate, scriptul de inserție și fișierele relevante.

## 6. Categorii Editoriale
Toate categoriile (sluguri, culori, teme editoriale) sunt documentate în **`categorii.md`**.
Sursa de adevăr pentru cod este **`src/lib/editorial-categories.ts`** — nu duplica
informația despre categorii în alte fișiere, importă din acest modul.
