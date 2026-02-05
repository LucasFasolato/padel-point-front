import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. Extend Colors (Optional but recommended for consistency)
      colors: {
        padel: {
          blue: '#2563EB', // Your Primary Brand Color
          dark: '#0F172A', // Your Dark Backgrounds
          green: '#10B981', // Success States
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