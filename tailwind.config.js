/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',   // ← This is required for dark mode
  theme: {
    extend: {},
  },
  plugins: [],
}