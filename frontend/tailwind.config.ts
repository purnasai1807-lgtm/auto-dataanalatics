import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
      },
      colors: {
        shell: {
          950: "#0b1320",
          900: "#102033",
          800: "#17304b",
          700: "#224669",
          200: "#d7e4f4",
          100: "#f5f9ff"
        },
        accent: {
          500: "#ff9f43",
          600: "#f97316"
        },
        mint: {
          500: "#2dd4bf",
          600: "#14b8a6"
        }
      },
      boxShadow: {
        panel: "0 24px 60px rgba(15, 23, 42, 0.18)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(45, 212, 191, 0.2), transparent 28%), radial-gradient(circle at top right, rgba(255, 159, 67, 0.2), transparent 22%), linear-gradient(135deg, rgba(16, 32, 51, 0.96), rgba(12, 18, 32, 0.94))"
      }
    },
  },
  plugins: [],
};
export default config;
