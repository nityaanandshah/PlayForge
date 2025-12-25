/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // App Foundations
        'bg-main': '#141210',
        'surface-1': '#1E1B18',
        'surface-2': '#26231F',
        'surface-3': '#2E2A25',
        'border-subtle': '#3A342D',
        
        // Brand Accent (Brass)
        'accent-primary': '#C08A3E',
        'accent-hover': '#D6A35C',
        'accent-active': '#A9742E',
        'accent-soft': 'rgba(192,138,62,0.12)',
        
        // Typography
        'text-primary': '#E6E2DC',
        'text-secondary': '#CFCAC1',
        'text-muted': '#9A958B',
        'text-disabled': '#6F6A61',
        
        // Status Colors
        'success': '#4E8F6A',
        'success-soft': 'rgba(78,143,106,0.14)',
        'danger': '#B24C3D',
        'danger-soft': 'rgba(178,76,61,0.14)',
        'warning': '#C8A14A',
        
        // Legacy primary mapping to brass (for compatibility)
        primary: {
          50: 'rgba(192,138,62,0.05)',
          100: 'rgba(192,138,62,0.1)',
          200: 'rgba(192,138,62,0.2)',
          300: 'rgba(192,138,62,0.3)',
          400: 'rgba(192,138,62,0.5)',
          500: '#C08A3E',
          600: '#C08A3E',
          700: '#A9742E',
          800: '#8F6127',
          900: '#7A5322',
        },
      },
      fontFamily: {
        'sans': ['Source Sans Pro', 'system-ui', 'sans-serif'],
        'serif': ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 1px 0 rgba(255,255,255,0.03), 0 12px 28px rgba(0,0,0,0.45)',
        'elevated': '0 1px 0 rgba(255,255,255,0.03), 0 16px 32px rgba(0,0,0,0.5)',
        'lifted': '0 1px 0 rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.55)',
        'floating': '0 1px 0 rgba(255,255,255,0.03), 0 24px 48px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}


