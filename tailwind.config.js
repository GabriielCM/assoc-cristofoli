/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066CC',
          600: '#0052a3',
          700: '#003d7a',
          800: '#002952',
          900: '#001429',
        },
        secondary: {
          50: '#e6f7f0',
          100: '#ccefe1',
          200: '#99dfc3',
          300: '#66cfa5',
          400: '#33bf87',
          500: '#00A86B',
          600: '#008656',
          700: '#006540',
          800: '#00432b',
          900: '#002215',
        },
        accent: {
          50: '#fff0eb',
          100: '#ffe1d6',
          200: '#ffc3ad',
          300: '#ffa585',
          400: '#ff875c',
          500: '#FF6B35',
          600: '#cc562a',
          700: '#994020',
          800: '#662b15',
          900: '#33150b',
        },
        background: '#F8F9FA',
        text: '#212529',
        card: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Roboto', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'card': '8px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
