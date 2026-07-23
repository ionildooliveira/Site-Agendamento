/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose:   { DEFAULT: '#E6A2B6', light: '#FAF0F2', dark: '#9E5E72' },
        gold:   { DEFAULT: '#D4AF37', light: '#F3E5AB', dark: '#996515' },
        cream:  { DEFAULT: '#FAF7F5', dark: '#F2ECE9' },
        blush:  '#FCF3F5',
        mink:   '#4B2F3D',
        darkmink: '#2A1521',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-rose-gold': 'linear-gradient(135deg, #E6A2B6 0%, #D4AF37 100%)',
        'gradient-dark':      'linear-gradient(135deg, #1A0D15 0%, #2A1521 100%)',
        'gradient-hero':      'linear-gradient(160deg, rgba(26,13,21,0.9) 0%, rgba(42,21,33,0.8) 60%, rgba(212,175,55,0.25) 100%)',
      },
      boxShadow: {
        'rose':  '0 10px 30px -5px rgba(230,162,182,0.35)',
        'gold':  '0 10px 30px -5px rgba(212,175,55,0.3)',
        'glass': '0 8px 32px 0 rgba(75, 47, 61, 0.08)',
        'card':  '0 4px 20px -2px rgba(75, 47, 61, 0.05)',
        'card-hover': '0 20px 40px -10px rgba(75, 47, 61, 0.12)',
      },
      animation: {
        'fade-in':    'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':   'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer':    'shimmer 2s infinite linear',
        'float':      'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(30px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        shimmer:   { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        float:     { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem', '3xl': '2rem' },
    },
  },
  plugins: [],
};
