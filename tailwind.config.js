/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9ceff',
          300: '#7fa4ff',
          400: '#3d72ff',
          500: '#1a50f0',
          600: '#0f3dd4',
          700: '#0e30a8',
          800: '#112882',
          900: '#13246a',
        }
      }
    },
  },
  plugins: [],
}
