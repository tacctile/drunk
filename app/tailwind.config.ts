import type { Config } from "tailwindcss";

// Dark only — semantic tokens live on :root in globals.css and map 1:1 here.
// Three type voices: Display (32/800/tight), Body (15/500), Label (12/600/
// uppercase/+0.06em). One radius (16px) plus full for initial circles.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    borderRadius: {
      none: "0",
      DEFAULT: "16px",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
      overlay: "0 24px 64px rgba(0, 0, 0, 0.6)",
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        raised: "var(--raised)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        dim: "var(--dim)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        good: "var(--good)",
        "good-soft": "var(--good-soft)",
        bad: "var(--bad)",
        "bad-soft": "var(--bad-soft)",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["13px", "20px"],
        base: ["15px", "24px"],
        lg: ["17px", "24px"],
        xl: ["20px", "28px"],
        "2xl": ["24px", "32px"],
        display: ["32px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "800" }],
      },
      letterSpacing: {
        label: "0.06em",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
