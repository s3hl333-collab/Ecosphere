import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#176B50",
          hover: "#12543E",
          subtle: "#EAF2EC",
          border: "#D1E2D6",
        },
        text: {
          primary: "#171C19",
          secondary: "#66716B",
          muted: "#626D66",
        },
        border: {
          DEFAULT: "#E5E9E5",
          strong: "#D2D8D2",
        },
        accent: {
          blue: "#2B6CB0",
          blueSubtle: "#EBF3FB",
          warning: "#A66A20",
          warningSubtle: "#FEF7EC",
          error: "#B74444",
          errorSubtle: "#FDF0F0",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(23, 28, 25, 0.05)",
        card: "0 1px 3px 0 rgba(23, 28, 25, 0.07), 0 1px 2px -1px rgba(23, 28, 25, 0.07)",
        dropdown: "0 4px 12px 0 rgba(23, 28, 25, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
