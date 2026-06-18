/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf9f1',
          100: '#faefd9',
          200: '#f4dbb1',
          300: '#ecbe81',
          400: '#e39d56',
          500: '#c17a26',
          600: '#ae651e',
          700: '#904e1a',
          800: '#753f1a',
          900: '#613518',
        },
        secondary: {
          50: '#fdf3f8',
          100: '#fbe8f3',
          200: '#f6cce4',
          300: '#f0a3cf',
          400: '#e76eb1',
          500: '#e2148d',
          600: '#c40b74',
          700: '#a7065e',
          800: '#8b084e',
          900: '#740b43',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          text: '#f8fafc',
          border: '#334155'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
