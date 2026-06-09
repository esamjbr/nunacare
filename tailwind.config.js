/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // All semantic tokens driven by CSS variables so html.night overrides swap the palette
        // without touching any component className.
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        // accent = alias for primary (warm brown); use interchangeably
        accent: 'rgb(var(--color-primary) / <alpha-value>)',
        'accent-soft': 'rgb(var(--color-accent-soft) / <alpha-value>)',
        'primary-container': 'rgb(var(--color-primary-container) / <alpha-value>)',
        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'soft-surface': 'rgb(var(--color-soft-surface) / <alpha-value>)',
        'surface-sunk': 'rgb(var(--color-surface-sunk) / <alpha-value>)',
        beige: 'rgb(var(--color-beige) / <alpha-value>)',
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-hint': 'rgb(var(--color-text-hint) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-hint) / <alpha-value>)',
        'text-faint': 'rgb(var(--color-text-faint) / <alpha-value>)',
        'error-soft': 'rgb(var(--color-error-soft) / <alpha-value>)',
        'error-text': 'rgb(var(--color-error-text) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-hairline': 'rgb(var(--color-border-hairline) / <alpha-value>)',
        'teal-soft': 'rgb(var(--color-teal-soft) / <alpha-value>)',
        // Category tints — icon-circle backgrounds
        'feeding-tint': 'rgb(var(--color-feeding-tint) / <alpha-value>)',
        'diaper-tint': 'rgb(var(--color-diaper-tint) / <alpha-value>)',
        // Log-type pastel icon backgrounds
        'sleep-soft': 'rgb(var(--color-sleep-soft) / <alpha-value>)',
        'warm-soft': 'rgb(var(--color-warm-soft) / <alpha-value>)',
        'success-soft': 'rgb(var(--color-success-soft) / <alpha-value>)',
        'success-text': 'rgb(var(--color-success-text) / <alpha-value>)',
        'lavender-soft': 'rgb(var(--color-lavender-soft) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Nunito Sans', 'system-ui', 'sans-serif'],
        arabic: ['Tajawal', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(139,74,43,0.06)',
        'card': '0 4px 20px rgba(139,74,43,0.08)',
        'elevated': '0 8px 32px rgba(139,74,43,0.12)',
        'inner-soft': 'inset 0 1px 3px rgba(139,74,43,0.06)',
      },
      maxWidth: {
        'mobile': '430px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
