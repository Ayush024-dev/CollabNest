const { yellow } = require('@mui/material/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        DarkBlue: '#3652A6',
        lightBlue: '#9FADF4',
        yellow: '#E8F842'
      },
      fontFamily: {
        inconsolata: ['Inconsolata', 'monospace'], // Adding Inconsolata
      },
    },
  },
  plugins: [],
};
