import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      colors: {
        navy: "hsl(var(--navy))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "print-out": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "led-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 6px 2px hsl(217 100% 60% / 0.8)" },
          "50%": { opacity: "0.55", boxShadow: "0 0 2px 0 hsl(217 100% 60% / 0.3)" },
        },
        blob: {
          "0%, 100%": { borderRadius: "42% 58% 62% 38% / 45% 42% 58% 55%" },
          "33%": { borderRadius: "58% 42% 38% 62% / 55% 60% 40% 45%" },
          "66%": { borderRadius: "48% 52% 55% 45% / 38% 52% 48% 62%" },
        },
        "dash-flow": {
          to: { strokeDashoffset: "-24" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        "draw-line": {
          from: { strokeDashoffset: "300" },
          to: { strokeDashoffset: "0" },
        },
        shimmer: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 5s ease-in-out infinite",
        "float-slow": "float 7s ease-in-out infinite",
        "print-out": "print-out 2.4s cubic-bezier(0.45, 0, 0.2, 1) 0.4s both",
        "led-pulse": "led-pulse 1.6s ease-in-out infinite",
        blob: "blob 14s ease-in-out infinite",
        "dash-flow": "dash-flow 1.2s linear infinite",
        sparkle: "sparkle 2.2s ease-in-out infinite",
        "draw-line": "draw-line 1.4s ease-out 0.6s both",
        shimmer: "shimmer 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
