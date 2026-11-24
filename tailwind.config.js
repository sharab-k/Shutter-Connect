/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#EEF3FF',
          100: '#DCE6FF',
          200: '#BCCFFF',
          300: '#8FADFF',
          400: '#5C82FF',
          500: '#2F5BFF',
          600: '#0A3CFF',
          700: '#0830D1',
          800: '#0A2AA0',
          900: '#0B2275',
          950: '#06091F',
        },
        plum: { 500: '#7B2FBE', 400: '#A04BD0', 300: '#C04FD0' },
        sun: { 300: '#F2E76A', 400: '#EBDB3F' },
        teal: { 500: '#0E8FA8', 600: '#0B7A90' },
        surface: '#FAFAFA',
        line: '#E6E6EA',
        ink: '#0B0B12',
      },
      backgroundImage: {
        hero: 'linear-gradient(160deg,#0A3CFF 0%,#1F2FD6 55%,#5B2BB0 100%)',
        cta: 'linear-gradient(90deg,#0A3CFF 0%,#2F5BFF 100%)',
        glow: 'radial-gradient(60% 60% at 20% 80%, rgba(192,79,208,.35) 0%, rgba(192,79,208,0) 70%)',
        ring: 'linear-gradient(45deg,#F2E76A 0%,#E85DC0 45%,#0A3CFF 100%)',
        bubble: 'linear-gradient(135deg,#0A3CFF 0%,#6D2FD0 100%)',
      },
      boxShadow: {
        card: '0 0 0 1px rgba(11,11,18,.02)',
        lift: '0 6px 18px -6px rgba(11,11,18,.18)',
      },
      borderRadius: { xl: '0.75rem', '2xl': '0.875rem', '3xl': '1.25rem' },
      keyframes: {
        heart: { '0%': { opacity: 0, transform: 'scale(.3)' }, '15%': { opacity: 1, transform: 'scale(1.15)' }, '30%': { transform: 'scale(.95)' }, '70%': { opacity: 1, transform: 'scale(1)' }, '100%': { opacity: 0, transform: 'scale(1.1)' } },
        tap: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.3)' }, '100%': { transform: 'scale(1)' } },
        sheet: { from: { transform: 'translateY(24px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
      },
      animation: { heart: 'heart .9s ease-out forwards', tap: 'tap .28s ease-out', sheet: 'sheet .22s ease-out both' },
    },
  },
  plugins: [],
};
