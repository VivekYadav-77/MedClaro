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
        ink: "#163247",
        mist: "#ecf7f7",
        sea: "#72b7be",
        tide: "#cae9e7",
        leaf: "#9bd4a5",
        foam: "#f8fcfc",
        sand: "#f5efe6"
      },
      fontFamily: {
        sans: ["var(--font-manrope)"],
        display: ["var(--font-fraunces)"]
      },
      boxShadow: {
        calm: "0 24px 60px rgba(22, 50, 71, 0.12)"
      },
      backgroundImage: {
        shell: "radial-gradient(circle at top left, rgba(114, 183, 190, 0.22), transparent 42%), linear-gradient(180deg, #f8fcfc 0%, #eef7f6 55%, #f5efe6 100%)"
      }
    }
  },
  plugins: []
};

export default config;
