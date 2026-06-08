import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        field: "#f6f8fb",
        signal: "#0f8b8d",
        coral: "#d95d39",
        line: "#d9e2ec"
      }
    }
  },
  plugins: []
};

export default config;
