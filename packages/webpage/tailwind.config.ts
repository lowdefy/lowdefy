import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff8ff',
          100: '#def0ff',
          200: '#b6e3ff',
          300: '#75cfff',
          400: '#2cb7ff',
          500: '#1990ff',
          600: '#0077f2',
          700: '#005fc4',
          800: '#0050a1',
          900: '#064585',
        },
        cyan: {
          400: '#29d3ca',
          500: '#22c3ba',
        },
      },
    },
  },
  plugins: [],
};

export default config;
