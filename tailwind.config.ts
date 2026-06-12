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
          sidebar: 'rgba(242, 239, 233, 0.75)', // Glassmorphic
          border: '#E5E0D8',
        },
        sepia: {
          bg: '#F5EDD6',
          text: '#1C1C1E',
          sidebar: 'rgba(238, 228, 196, 0.75)', // Glassmorphic
          border: '#DDD0A8',
        },
        dark: {
          bg: '#1A1A1A',
          text: '#E8E6E0',
          sidebar: 'rgba(36, 36, 36, 0.75)', // Glassmorphic
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
        serif: ['var(--font-playfair)', 'Lora', 'Georgia', 'serif'],
        sans: ['var(--font-outfit)', 'Inter', 'system-ui', 'sans-serif'],
        reading: ['var(--font-lora)', 'Georgia', 'serif'],
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
        'spring-up': 'springUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
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
        springUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        soft: '0 4px 12px rgba(0,0,0,0.05)',
        'soft-lg': '0 8px 24px rgba(0,0,0,0.08)',
        popover: '0 12px 40px rgba(0,0,0,0.12)',
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
