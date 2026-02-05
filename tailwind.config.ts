import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. Extend Colors - Padel Brand Identity
      colors: {
        padel: {
          primary: '#10B981',    // Emerald-600 - Primary CTA & brand
          dark: '#0F172A',       // Slate-900 - Dark backgrounds
          surface: '#F8FAFC',    // Slate-50 - Light backgrounds
          border: '#E2E8F0',     // Slate-200 - Borders
          muted: '#64748B',      // Slate-500 - Muted text
        }
      },
      // 2. Custom Keyframes (The "World Class" Motion)
      keyframes: {
        "slide-up": {
          "0%": { transform: "translate(-50%, 100%)", opacity: "0" },
          "100%": { transform: "translate(-50%, -50%)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        }
      },
      // 3. Animation Utility Classes
      animation: {
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)", // Apple-like smooth curve
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;