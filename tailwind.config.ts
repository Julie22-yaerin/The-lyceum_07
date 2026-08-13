import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        text: "var(--text)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        "text-4": "var(--text-4)",
        faint: "var(--faint)",
        hairline: "var(--hairline)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        live: "var(--live)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font)"],
      },
      borderRadius: {
        pill: "var(--r-pill)",
        chip: "var(--r-chip)",
        thumb: "var(--r-thumb)",
        sheet: "var(--r-sheet)",
        card: "var(--r-card)",
        panel: "var(--r-panel)",
        hero: "var(--r-hero)",
      },
      boxShadow: {
        panel: "var(--sh-panel)",
        overlay: "var(--sh-overlay)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
