/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        synora: {
          navy: '#0A1128',
          slate: '#0F172A',
          blue: '#1E40AF',
          cyan: '#06B6D4',
          cyanLight: '#E0F2FE',
          electric: '#2563EB',
          accent: '#4F46E5',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
