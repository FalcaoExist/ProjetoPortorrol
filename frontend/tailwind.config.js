/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily:{
        poppins: ["poppins"]
      },
      colors: {
        primary: "#2C1F5D",
        secondary: "#E7B77E"
      }
    },
  },
  plugins: [],
}

