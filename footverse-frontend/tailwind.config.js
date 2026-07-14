/**
 * FootVerse design tokens — matched to the hero reference.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F7F4EF", // hero background
        porcelain: "#EFEAE1", // soft panels / sweeps
        espresso: "#33231A", // headlines, buttons, "Foot"
        taupe: "#6E655C", // descriptions
        gold: "#A5793A", // "Verse", accents, taglines
        goldsoft: "#D9B87A", // glows / hover tints
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "sans"],
        condensed: ["Oswald", "Arial Narrow", "sans"],
        sans: ["Inter", "system-ui", "sans"],
      },
      boxShadow: {
        cta: "0 14px 30px -14px rgba(51, 35, 26, 0.55)",
      },
      dropShadow: {
        shoe: "0 30px 26px rgba(51, 35, 26, 0.20)",
      },
    },
  },
  plugins: [],
};