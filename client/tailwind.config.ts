import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand palette
        brand: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        teal: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        // Neutral grays
        slate: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        // Status colors
        success: "#22c55e",
        warning: "#f59e0b",
        danger:  "#ef4444",
        // Legacy aliases (keep for backward compatibility during refactor)
        ink:  "#0f172a",
        mist: "#f0fdfa",
        sea:  "#14b8a6",
        tide: "#ccfbf1",
        leaf: "#22c55e",
        foam: "#f8fafc",
        sand: "#fef9ee",
      },
      fontFamily: {
        sans:    ["var(--font-inter)"],
        display: ["var(--font-jakarta)"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
        boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.10)",
        navbar:  "0 1px 0 rgba(0,0,0,0.06)",
        dialog:  "0 20px 60px rgba(0,0,0,0.12)",
        bento: "0 4px 20px -2px rgba(0,0,0,0.04), 0 0 3px rgba(0,0,0,0.02)",
        "bento-hover": "0 10px 30px -4px rgba(0,0,0,0.08), 0 4px 10px -2px rgba(0,0,0,0.04)",
        // legacy
        calm:    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
      },
      backgroundImage: {
        // Lightweight, GPU-friendly gradient (no complex radials)
        "page-gradient": "linear-gradient(180deg, #f8fafc 0%, #f0fdfa 100%)",
        // legacy alias
        shell: "linear-gradient(180deg, #f8fafc 0%, #f0fdfa 100%)",
      },
      animation: {
        "fade-in":    "fadeIn 0.18s ease-out",
        "slide-up":   "slideUp 0.22s ease-out",
        "scale-in":   "scaleIn 0.15s ease-out",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" },                  to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.96)" },     to: { opacity: "1", transform: "scale(1)" } },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    }
  },
  plugins: []
};

export default config;
