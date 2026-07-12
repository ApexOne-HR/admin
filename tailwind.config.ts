import type { Config } from 'tailwindcss';
import { tailwindColors } from './src/theme/tailwindColors';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: tailwindColors,
      fontFamily: {
        mui: ['"Inter"', '"Roboto"', '"Helvetica"', '"Arial"', 'sans-serif'],
        sans: ['"Inter"', '"Roboto"', '"Helvetica"', '"Arial"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
