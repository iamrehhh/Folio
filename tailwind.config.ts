import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Reading themes
        light: {
          bg: '#FAF8F4',
          text: '#1C1C1E',
          sidebar: '#F2EFE9',
          border: '#E5E0D8',
        },
        sepia: {
          bg: '#F5EDD6',
          text: '#1C1C1E',
          sidebar: '#EEE4C4',
          border: '#DDD0A8',
        },
        dark: {
          bg: '#1A1A1A',
          text: '#E8E6E0',
          sidebar: '#242424',
          border: '#333333',
        },
        // Brand accent
        accent: {
          DEFAULT: '#8B6914',
          light: '#A07D20',
          dark: '#6D520F',
          muted: '#8B691420',
        },
        // Highlight colors
        highlight: {
          yellow: '#FFE066',
          blue: '#93C5FD',
          green: '#86EFAC',
          pink: '#F9A8D4',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'reading-sm': '14px',
        'reading-base': '17px',
        'reading-lg': '19px',
        'reading-xl': '22px',
      },
      lineHeight: {
        reading: '1.8',
      },
      maxWidth: {
        reading: '750px',
        'chapter-sidebar': '220px',
        'ai-panel': '320px',
      },
      width: {
        'chapter-sidebar': '220px',
        'ai-panel': '320px',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'slide-out-right': 'slideOutRight 0.25s ease-in',
        'fade-in': 'fadeIn 0.15s ease-out',
        'float-up': 'floatUp 0.2s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.08)',
        'soft-lg': '0 4px 20px rgba(0,0,0,0.10)',
        popover: '0 8px 30px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
