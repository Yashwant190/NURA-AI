/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          900: '#0c4a6e',
          950: '#082f49',
        },
        neon: {
          blue: '#00f3ff',
          purple: '#bc13fe',
          green: '#0aff00',
        }
      }
    },
  },
  plugins: [],
};
