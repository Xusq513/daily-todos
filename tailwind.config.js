/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fluent: {
          bg: 'rgba(255, 255, 255, 0.75)',
          'bg-dark': 'rgba(24, 24, 27, 0.80)',
          card: 'rgba(255, 255, 255, 0.65)',
          'card-dark': 'rgba(39, 39, 42, 0.70)',
          border: 'rgba(255, 255, 255, 0.3)',
          'border-dark': 'rgba(255, 255, 255, 0.12)',
        }
      },
      backdropBlur: {
        'xs': '2px',
        'fluent': '20px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 0.4s ease-in-out 1',
      }
    },
  },
  plugins: [],
}
