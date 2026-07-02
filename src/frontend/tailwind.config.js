import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "color-mix(in srgb, var(--border) <alpha-value>, transparent)",
        input: "color-mix(in srgb, var(--input) <alpha-value>, transparent)",
        ring: "color-mix(in srgb, var(--ring) <alpha-value>, transparent)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "color-mix(in srgb, var(--primary) <alpha-value>, transparent)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "color-mix(in srgb, var(--secondary) <alpha-value>, transparent)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "color-mix(in srgb, var(--destructive) <alpha-value>, transparent)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "color-mix(in srgb, var(--muted) <alpha-value>, transparent)",
          foreground: "color-mix(in srgb, var(--muted-foreground) <alpha-value>, transparent)",
        },
        accent: {
          DEFAULT: "color-mix(in srgb, var(--accent) <alpha-value>, transparent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "color-mix(in srgb, var(--popover) <alpha-value>, transparent)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "color-mix(in srgb, var(--card) <alpha-value>, transparent)",
          foreground: "var(--card-foreground)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "color-mix(in srgb, var(--sidebar-primary) <alpha-value>, transparent)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "color-mix(in srgb, var(--sidebar-accent) <alpha-value>, transparent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "color-mix(in srgb, var(--sidebar-border) <alpha-value>, transparent)",
          ring: "color-mix(in srgb, var(--sidebar-ring) <alpha-value>, transparent)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Oswald", "sans-serif"],
        heading: ["var(--font-heading)", "Oswald", "sans-serif"],
        body: ["var(--font-body)", "Barlow", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.40)",
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.45), 0 1px 2px -1px rgba(0, 0, 0, 0.40)",
        elevated: "0 10px 30px -12px rgba(0, 0, 0, 0.70), 0 4px 10px -4px rgba(0, 0, 0, 0.55)",
        card: "0 2px 8px -2px rgba(0, 0, 0, 0.55), 0 1px 3px -1px rgba(0, 0, 0, 0.45)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) both",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
