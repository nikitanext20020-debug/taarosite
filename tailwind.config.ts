import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Тёмная мистическая палитра (как taroyal.ru)
        void: '#07090f',
        night: '#0d1018',
        midnight: '#141826',
        ash: '#1c2236',
        gold: '#c8a35c',
        'gold-bright': '#e6c478',
        moon: '#d9d3c4',
        mystic: '#8b6fd4',
        blood: '#7a1f2b',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 30px -5px rgba(200,163,92,0.25)',
        glow: '0 0 25px rgba(200,163,92,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'rise': 'rise 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
