/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ePerformance Branding
        ep: {
          violet: {
            50: '#faf5ff',
            100: '#f3e8ff',
            200: '#e9d5ff',
            300: '#d8b4fe',
            400: '#c084fc',
            500: '#a855f7', // Primary
            600: '#9333ea',
            700: '#7e22ce',
            800: '#6b21a8',
            900: '#581c87',
          },
          purple: {
            500: '#8b5cf6',
            600: '#7c3aed',
          },
        },
      },
      boxShadow: {
        'ep': '0 12px 48px rgba(168, 85, 247, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)',
        'ep-lg': '0 20px 64px rgba(168, 85, 247, 0.2), 0 8px 24px rgba(0, 0, 0, 0.1)',
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
