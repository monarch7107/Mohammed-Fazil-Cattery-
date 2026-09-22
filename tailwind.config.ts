import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Tailwind v3 ships opacity in steps of 5 and has no 4.5/13 spacing.
      // The brand uses finer steps, so they are defined here.
      opacity: {
        2: "0.02",
        4: "0.04",
        8: "0.08",
        12: "0.12",
        15: "0.15",
        18: "0.18",
        22: "0.22",
        24: "0.24",
        28: "0.28",
        32: "0.32",
        33: "0.33",
        35: "0.35",
        42: "0.42",
        45: "0.45",
        55: "0.55",
        62: "0.62",
        65: "0.65",
        72: "0.72",
        85: "0.85",
        92: "0.92",
      },
      spacing: {
        4.5: "1.125rem",
        5.5: "1.375rem",
        6.5: "1.625rem",
        7.5: "1.875rem",
        13: "3.25rem",
        15: "3.75rem",
        18: "4.5rem",
        22: "5.5rem",
      },
      colors: {
        cream: {
          DEFAULT: "#F8F3EA",
          50: "#FDFAF4",
          100: "#F8F3EA",
          200: "#F1E9DA",
          300: "#E7DBC6",
        },
        navy: {
          DEFAULT: "#102A43",
          50: "#EEF3F8",
          100: "#DCE6EF",
          200: "#B4C6D8",
          400: "#486581",
          600: "#1D3F5E",
          700: "#102A43",
          800: "#0B1F33",
          900: "#071624",
        },
        brown: {
          DEFAULT: "#7A451E",
          50: "#F7EDE5",
          100: "#F0DFD2",
          200: "#DFC0A6",
          600: "#93561F",
          700: "#7A451E",
          800: "#5C3316",
        },
        green: {
          DEFAULT: "#245C3A",
          50: "#E9F2EC",
          100: "#D6E7DC",
          200: "#AECFBB",
          600: "#2C6E47",
          700: "#245C3A",
          800: "#1A462C",
        },
        ink: "#18212B",
        line: "rgba(16, 42, 67, 0.12)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Manrope", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["clamp(2.75rem, 6vw, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-xl": ["clamp(2.25rem, 4.6vw, 3.75rem)", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(1.875rem, 3.4vw, 2.875rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(1.5rem, 2.4vw, 2.125rem)", { lineHeight: "1.16", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        editorial: "0.22em",
        wider2: "0.14em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,42,67,0.04), 0 18px 40px -24px rgba(16,42,67,0.35)",
        "card-hover": "0 2px 4px rgba(16,42,67,0.05), 0 28px 56px -28px rgba(16,42,67,0.42)",
        dock: "0 8px 30px -12px rgba(16,42,67,0.35)",
        pill: "0 10px 26px -12px rgba(16,42,67,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translate3d(0, 18px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "draw-rule": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "paw-drift": {
          "0%": { opacity: "0", transform: "translate3d(0, 12px, 0) rotate(-6deg)" },
          "30%": { opacity: "0.5" },
          "100%": { opacity: "0", transform: "translate3d(0, -34px, 0) rotate(4deg)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease both",
        "scale-in": "scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "draw-rule": "draw-rule 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2.2s ease-in-out infinite",
        bob: "bob 3.2s ease-in-out infinite",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
