import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./modules/**/*.{ts,tsx}", "./shared/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF7EB", // cream
          100: "#F2F7FD",
          200: "#DAE8F7",
          400: "#6FA3D8",
          600: "#2D5DA8",
          yellow: "#FFE8A6", // warm accent
        },
      },
    },
  },
  plugins: [],
};

export default config;
