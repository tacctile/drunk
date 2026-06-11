import type { Config } from "tailwindcss";

// Semantic tokens live as CSS variables in globals.css so light/dark are a
// single class flip on <html>. Spacing stays on Tailwind's default 4px grid.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        good: "var(--good)",
        "good-soft": "var(--good-soft)",
        bad: "var(--bad)",
        "bad-soft": "var(--bad-soft)",
        food: "var(--food)",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        "2xs": ["11px", "16px"],
        xs: ["12px", "16px"],
        sm: ["13px", "20px"],
        base: ["15px", "24px"],
        lg: ["17px", "24px"],
        xl: ["20px", "28px"],
        "2xl": ["24px", "32px"],
        "3xl": ["30px", "36px"],
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "14px",
        xl: "18px",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
      boxShadow: {
        sheet: "0 -8px 32px rgba(0,0,0,0.28)",
        pop: "0 12px 40px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
