import type { Config } from "tailwindcss";

/**
 * Hoppz UI Tailwind preset — M3-style design tokens extracted from the Stitch design system.
 * Import into your tailwind.config.ts: presets: [require('./src/components/hoppz-ui/tailwind.preset')]
 */
const preset: Config = {
  content: [],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        tertiary: "#e8c352",
        "surface-container": "#1e2022",
        "surface-tint": "#89ceff",
        outline: "#88929b",
        "on-error": "#690005",
        "tertiary-container": "#caa739",
        "inverse-surface": "#e3e2e6",
        "tertiary-fixed-dim": "#e8c352",
        "error-container": "#93000a",
        "on-tertiary-fixed-variant": "#574400",
        "surface-container-high": "#292a2d",
        "on-secondary-fixed": "#121f00",
        secondary: "#9cd92f",
        "surface-dim": "#121316",
        "on-primary-fixed-variant": "#004c6e",
        "on-tertiary-fixed": "#241a00",
        "on-primary-fixed": "#001e2f",
        "on-tertiary-container": "#4f3d00",
        "inverse-on-surface": "#2f3033",
        primary: "#89ceff",
        "on-secondary-container": "#2c4400",
        "secondary-container": "#7fb900",
        "surface-variant": "#343538",
        "on-primary": "#00344d",
        "surface-bright": "#38393c",
        "on-secondary": "#223600",
        "outline-variant": "#3e4850",
        "on-primary-container": "#003751",
        "primary-fixed": "#c9e6ff",
        "secondary-fixed-dim": "#9cd92f",
        "on-secondary-fixed-variant": "#344e00",
        "on-tertiary": "#3d2f00",
        "tertiary-fixed": "#ffe08a",
        "inverse-primary": "#006591",
        "surface-container-highest": "#343538",
        surface: "#121316",
        "primary-fixed-dim": "#89ceff",
        "on-surface-variant": "#bec8d2",
        "surface-container-low": "#1a1b1e",
        "on-error-container": "#ffdad6",
        "secondary-fixed": "#b7f64c",
        "on-surface": "#e3e2e6",
        error: "#ffb4ab",
        background: "#121316",
        "primary-container": "#0ea5e9",
        "surface-container-lowest": "#0d0e11",
        "on-background": "#e3e2e6",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        unit: "4px",
        "tap-target-min": "44px",
        "margin-mobile": "16px",
        "gutter-mobile": "12px",
      },
      fontFamily: {
        "label-sm": ["Manrope"],
        "meta-xs": ["Manrope"],
        "body-md": ["Manrope"],
        "title-md": ["Manrope"],
        "display-lg": ["Manrope"],
      },
      fontSize: {
        "label-sm": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" },
        ],
        "meta-xs": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "body-md": ["15px", { lineHeight: "20px", fontWeight: "500" }],
        "title-md": [
          "17px",
          {
            lineHeight: "22px",
            letterSpacing: "-0.01em",
            fontWeight: "700",
          },
        ],
        "display-lg": [
          "28px",
          {
            lineHeight: "34px",
            letterSpacing: "-0.02em",
            fontWeight: "800",
          },
        ],
      },
    },
  },
  plugins: [],
};

export default preset;
