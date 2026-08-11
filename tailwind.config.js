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
          pink: '#e27376',
          pinkHover: '#d46063',
          pinkLight: '#fdf2f4',
          pinkSoft: '#f7d8dc',
          navy: '#2b3445',
          navyDark: '#1b2333',
          card: '#ffffff',
          accent: '#e27376',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
