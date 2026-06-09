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
      spacing: {
        'card-sm': '1rem',
        'card-md': '1.5rem',
        'card-lg': '2rem',
        'section-gap': '2rem',
        'section-gap-lg': '3.5rem',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Canonical 6-level typography scale (project-wide).
        // Format: [size, { lineHeight, fontWeight }] — explicit `font-*` classes still override the embedded weight.
        display: ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        title: ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        subtitle: ['17px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        micro: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      colors: {
        // Cores institucionais CAIXA — fonte única via CSS vars (--caixa-*)
        caixa: {
          blue: "var(--caixa-blue)",
          orange: "var(--caixa-orange)",
          gray: {
            dark: "#333333",
            light: "#E5E5E5",
          },
        },
        whatsapp: {
          green: "var(--whatsapp-green)",
          bubble: "var(--whatsapp-bubble)",
          dark: "var(--whatsapp-dark)",
        },
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
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
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        zone: {
          conservadora: "hsl(var(--zone-conservadora))",
          equilibrada: "hsl(var(--zone-equilibrada))",
          agressiva: "hsl(var(--zone-agressiva))",
        },
        landing: {
          bg: "hsl(var(--landing-bg))",
          fg: "hsl(var(--landing-fg))",
          heading: "hsl(var(--landing-heading))",
          muted: "hsl(var(--landing-muted))",
          light: "hsl(var(--landing-light))",
          dark: "hsl(var(--landing-dark))",
          "dark-mid": "hsl(var(--landing-dark-mid))",
          "dark-deep": "hsl(var(--landing-dark-deep))",
          gold: "hsl(var(--landing-gold))",
          "gold-hover": "hsl(var(--landing-gold-hover))",
          border: "hsl(var(--landing-border))",
          nav: "hsl(var(--landing-nav))",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
