import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        graphite: "#374151",
        line: "#d9dde5",
        panel: "#f7f8fa",
        action: "#1769e0",
        positive: "#138a42",
        negative: "#c81e1e"
      },
      boxShadow: {
        sheet: "0 -10px 28px rgba(17, 24, 39, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;

