/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fcf8f6',
          100: '#f8efeb',
          200: '#f0dbd2',
          300: '#e4bcad',
          400: '#d49581',
          500: '#c3735b',
          600: '#b15a45',
          700: '#934737',
          800: '#793d31',
          900: '#64362d',
          950: '#361a15',
        },
        ush: {
          dark: '#121212',
          card: '#1e1e1e',
          gold: '#d4af37',
          pink: '#e8a8b8',
          accent: '#2c3e50',
          softBg: '#faf9f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
