import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1B0D02",
        surface: "rgba(185,146,59,0.06)",
        "surface-hover": "rgba(185,146,59,0.10)",
        "surface-border": "rgba(185,146,59,0.15)",
        accent: "#B9923B",
        "accent-light": "#D4B96A",
        cream: "#E5D5BF",
        "cream-dark": "#D4C4A8",
        chocolate: "#1B0D02",
        "chocolate-light": "#2D1A08",
        "text-primary": "#ffffff",
        "text-secondary": "rgba(255,255,255,0.6)",
        "text-muted": "rgba(255,255,255,0.3)",
        "frelo-gold": "#B9923B",
        "frelo-cream": "#E5D5BF",
        "frelo-chocolate": "#1B0D02",
        "frelo-gold-dark": "#9F7925",
        danger: "#E74C3C",
        success: "#27AE60",
        warning: "#F39C12",
      },
      fontFamily: {
        sans: ["Afacad", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "16px",
        input: "12px",
        pill: "9999px",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #B9923B, #9F7925)",
        "brand-gradient": "linear-gradient(135deg, #FFF79A, #B9923B, #9F7925)",
      },
    },
  },
  plugins: [],
};
export default config;
