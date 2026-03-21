import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'n-bg': '#0a1a0f',
        'n-surface': '#0f2a18',
        'n-gold': '#C9A84C',
        'n-cream': '#f5f0e8',
        'n-cream-muted': 'rgba(245,240,232,0.6)',
        'n-border': 'rgba(201,168,76,0.25)',
      },
      borderRadius: {
        'nomara': '12px',
      },
    },
  },
  plugins: [],
};
export default config;
