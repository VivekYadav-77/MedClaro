import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        claro: {
          ink: "#17202a",
          background: "#f7fafc",
          surface: "#ffffff",
          muted: "#f1f5f9",
          border: "#d8e2ea",
          blue: "#1f6feb",
          mint: "#22a06b",
          amber: "#b7791f",
          rose: "#c2415b",
          critical: "#b42318",
          teal: "#0f766e",
          sky: "#e8f2ff"
        }
      },
      boxShadow: {
        shell: "0 1px 2px rgba(23, 32, 42, 0.06)",
        panel: "0 1px 3px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
