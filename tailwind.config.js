/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter, General Sans, Outfit',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        display: [
          'Inter, General Sans, Outfit',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      colors: {
        accent: {
          50: '#f0fdf9',
          100: '#e0faf4',
          200: '#c1f5eb',
          300: '#54f2a6', // Primary teal/mint accent
          400: '#2ae88f',
          500: '#06d977',
          600: '#05b969',
          700: '#048a54',
          800: '#036b44',
          900: '#024c34',
        },
      },
      spacing: {
        'section': '3rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'accent-sm': '0 4px 16px rgba(84, 242, 166, 0.1)',
        'accent-md': '0 8px 24px rgba(84, 242, 166, 0.15)',
      },
      backdropBlur: {
        'xl': '20px',
      },
    },
  },
  plugins: [],
}
