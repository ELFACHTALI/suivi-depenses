import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        // Design tokens extraits de la maquette fintrack_desktop_ui.html
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f8f7f4",
          border: "#e8e6e1",
        },
        text: {
          primary: "#1a1917",
          secondary: "#6b6860",
          tertiary: "#9c9a95",
        },
        accent: {
          DEFAULT: "#1a1917",
          hover: "#2d2b28",
        },
        success: {
          DEFAULT: "#16a34a",
          light: "#f0fdf4",
        },
        warning: {
          DEFAULT: "#d97706",
          light: "#fffbeb",
        },
        danger: {
          DEFAULT: "#dc2626",
          light: "#fef2f2",
        },
        info: {
          DEFAULT: "#2563eb",
          light: "#eff6ff",
        },
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        lg: "16px",
      },
    },
  },
  plugins: [],
} satisfies Config;
