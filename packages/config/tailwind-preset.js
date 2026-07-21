/** Life ID shared Tailwind preset — teal design system */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdfb", 100: "#d5f9f3", 200: "#aff1e8", 300: "#79e4d7",
          400: "#3ccebd", 500: "#1fb2a3", 600: "#0f9186", 700: "#11746c",
          800: "#135c57", 900: "#144d49", 950: "#052e2c"
        },
        danger: "#e5484d"
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" }
    }
  },
  plugins: []
}
