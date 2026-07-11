import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        claro: {
          ink: "#17202a",
          blue: "#1f6feb",
          mint: "#22a06b",
          amber: "#b7791f",
          rose: "#c2415b"
        }
      }
    }
  },
  plugins: []
};

export default config;
