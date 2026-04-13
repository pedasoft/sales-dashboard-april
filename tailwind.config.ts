import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        panel: 'var(--panel)',
        muted: 'var(--muted)',
        text: 'var(--text)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        positive: 'var(--positive)',
        danger: 'var(--danger)'
      },
      boxShadow: {
        soft: '0 8px 28px rgba(0,0,0,0.12)'
      }
    }
  },
  plugins: []
};

export default config;
