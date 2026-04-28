/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          900: '#4B1C1C',
          800: '#6E1E1E',
          700: '#8B1E1E',
          600: '#A72828'
        },


      }
    },
  },
  plugins: [],
}

