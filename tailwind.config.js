/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': {
          700: '#1a365d',
          800: '#0f2a4a',
          900: '#0a192f',
        }
      },
    },
  },
  plugins: [],
}