/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0b0b0d',
        surface: '#141416',
        elevated: '#1c1c20',
        elevated2: '#26262b',
        line: 'rgba(255,255,255,0.08)',
        accent: {
          DEFAULT: '#7c5cfc',
          hover: '#8f72ff',
          2: '#22d3c8',
        },
        text: {
          primary: '#f5f5f7',
          secondary: '#a1a1aa',
          muted: '#6b6b72',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 12px 30px -8px rgba(0,0,0,0.45)',
        bar: '0 -8px 30px -8px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #7c5cfc 0%, #22d3c8 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
