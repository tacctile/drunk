import type { Config } from "tailwindcss";

// Dark only — semantic tokens live on :root in globals.css and map 1:1 here.
// Type voices: Display 28/800/tight, Title 17/700, Body 15/500, Label 12/600/
// uppercase/+0.06em, Meta 13/400. Radius: 12px cards, 8px buttons/inputs,
// 6px chips/badges, 9999px pills only. Transitions 160ms ease.
// Grade colors are literal hex (not vars) so Tailwind opacity modifiers like
// bg-grade-a/15 work; the values mirror the --grade-* variables exactly.
const config: Config = {
  presets: [require("../src/components/hoppz-ui/tailwind.preset")],
  content: [
    "./src/**/*.{ts,tsx}",
    "../src/components/hoppz-ui/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        none: "0",
        chip: "6px",
        btn: "8px",
        DEFAULT: "8px",
        card: "12px",
        full: "9999px",
      },
      boxShadow: {
        none: "none",
        overlay: "0 24px 64px rgba(0, 0, 0, 0.6)",
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        raised: "var(--surface-raised)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "ink-dim": "var(--ink-dim)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        green: "var(--green)",
        "green-dim": "var(--green-dim)",
        red: "var(--red)",
        "red-dim": "var(--red-dim)",
        grade: {
          a: "#34D399",
          b: "#86EFAC",
          c: "#FCD34D",
          d: "#FB923C",
          f: "#F87171",
        },
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        label: ["12px", { lineHeight: "16px", letterSpacing: "0.06em", fontWeight: "600" }],
        meta: ["13px", "18px"],
        base: ["15px", "22px"],
        title: ["17px", { lineHeight: "24px", fontWeight: "700" }],
        display: ["28px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "800" }],
      },
      letterSpacing: {
        label: "0.06em",
      },
      transitionDuration: {
        DEFAULT: "160ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
    },
  },
  plugins: [],
};
export default config;
