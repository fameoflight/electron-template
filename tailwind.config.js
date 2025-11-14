/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  corePlugins: {
    preflight: true,
  },
  important: false,
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
