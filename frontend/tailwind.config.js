/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        eb: {
          orange: '#F6682F',
          'orange-hover': '#E55A20',
          'orange-light': '#FFF0E8',
          dark: '#1E0A3C',
          gray: '#6F7287',
          'gray-light': '#A6A8B8',
          'gray-bg': '#F8F7FA',
          'gray-border': '#D4D5D9',
          green: '#0D9E5C',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'Arial', 'Helvetica', 'sans-serif'],
      },
      maxWidth: {
        '8xl': '1440px',
      },
    },
  },
  plugins: [],
};
