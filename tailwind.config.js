/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#E34301",
        secondary: "#1F982A",
      },
    },
  },
  plugins: [animate],
  theme: {
    extend: {
      fontFamily: {
        logo: ['"Madimi One"', "sans-serif"],
        main: ["Montserrat", "sans-serif"],
      },
    },
  },
};
