export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#111827', // Midnight navy
        deepIndigo: '#4F46E5', // Deep indigo
        electricCyan: '#06B6D4', // Electric cyan
        softBg: '#F8FAFC', // Soft background
        cardWhite: '#FFFFFF', // White cards
        mainText: '#0F172A', // Main text
        secondaryText: '#64748B', // Secondary text
        success: '#10B981',
        error: '#F43F5E',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'tilt': {
          '0%': { transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' },
          '100%': { transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
