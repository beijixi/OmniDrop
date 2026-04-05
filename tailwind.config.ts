import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#f3f4f6",
        line: "#e5e7eb",
        brand: "#0f766e",
        brandSoft: "#ccfbf1"
      },
      boxShadow: {
        panel: "0 12px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
