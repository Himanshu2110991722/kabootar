/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed', 100: '#ffedd5', 400: '#fb923c',
          500: '#f97316', 600: '#ea580c', 700: '#c2410c',
        },
      },
    },
  },
  plugins: [],
};
