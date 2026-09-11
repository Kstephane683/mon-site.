/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charte graphique ePerformance (sombre + or)
        bg: {
          DEFAULT: '#08080c',
          secondary: '#0c0c10',
          card: '#101014',
          card2: '#14141a',
        },
        border: {
          DEFAULT: '#1c1c22',
          light: '#282830',
        },
        text: {
          DEFAULT: '#edeae3',
          muted: '#7a7a85',
          soft: '#b0aaa0',
        },
        gold: {
          DEFAULT: '#c9a96e',
          light: '#e2c07a',
          bg: 'rgba(201, 169, 110, 0.08)',
          border: 'rgba(201, 169, 110, 0.22)',
          glow: 'rgba(201, 169, 110, 0.4)',
        },
        // Couleurs d'accent compatibles
        primary: {
          DEFAULT: '#c9a96e',
          dark: '#b08e4e',
          light: '#e2c07a',
        },
        secondary: {
          DEFAULT: '#1a42c0',
          dark: '#0f2a7a',
          light: '#2452d8',
        },
      },
      boxShadow: {
        'ep': '0 8px 24px rgba(201, 169, 110, 0.2)',
        'ep-lg': '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(201, 169, 110, 0.1)',
      },
      fontFamily: {
        cormorant: ['Cormorant Garamond', 'Georgia', 'serif'],
        dm: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slideInUp': 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
