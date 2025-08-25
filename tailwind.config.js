export default {
  content: ["./index.html", "./src/**/*.{svelte,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0F141E",
          surface: "#1A1A2E",
          accent: "#E94560",
          neon: "#00FFFF",
          gradientFrom: "#E94560",
          gradientTo: "#00FFFF",
        },
      },
    },
  },
  plugins: [],
};
