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
        ush: {
          pink: '#d88193',
          pinkDark: '#c06579',
          pinkHover: '#b5586c',
          pinkLight: '#fdf3f5',
          pinkSoft: '#f8e4e8',
          navy: '#1b2333',
          navyDark: '#121824',
          card: '#ffffff',
          accent: '#d88193',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
