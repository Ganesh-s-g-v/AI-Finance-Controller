import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        surface: {
          DEFAULT: 'var(--bg-secondary)',
          elevated: 'var(--bg-tertiary)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
        foreground: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        brand: {
          DEFAULT: '#0066CC', // Apple blue
          hover: '#0055B3',
          light: '#E5F0FA',
          dark: '#003366',
        },
        status: {
          matched: '#34C759', // Apple green
          review: '#FF9500',  // Apple orange
          exception: '#FF3B30', // Apple red
          info: '#007AFF', // Apple blue
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      boxShadow: {
        'apple-light': '0 4px 24px -4px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.02)',
        'apple-heavy': '0 12px 48px -12px rgba(0, 0, 0, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.04)',
        'apple-glass': 'inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 4px 24px -4px rgba(0, 0, 0, 0.04)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
        'card-light': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} satisfies Config;
