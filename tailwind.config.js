/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        netflix: {
          red: "#e50914",
          "red-dark": "#f40612",
          black: "#141414",
        },
      },
    },
  },
  plugins: [],
};
