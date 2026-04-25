/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2F3E46',
        secondary: '#84A98C',
        accent: '#52796F',
        light: '#CAD2C5',
        background: '#F6F7F8',
      },
      fontFamily: {
        'sans': ['Roboto', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}