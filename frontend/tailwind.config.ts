import type { Config } from 'tailwindcss';

/** Хвост: токены соответствуют docs/manifests/ui/tokens.md. Сырые HEX в компонентах запрещены. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        'surface-2': 'var(--c-surface-2)',
        border: 'var(--c-border)',
        'border-strong': 'var(--c-border-strong)',
        gold: 'var(--c-gold)',
        'gold-dim': 'var(--c-gold-dim)',
        cyan: 'var(--c-cyan)',
        text: 'var(--c-text)',
        muted: 'var(--c-text-muted)',
        success: 'var(--c-success)',
        warning: 'var(--c-warning)',
        danger: 'var(--c-danger)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: { sm: '8px', md: '12px', lg: '20px' },
      maxWidth: { container: '1200px', narrow: '760px' },
      transitionTimingFunction: { out: 'cubic-bezier(.16,1,.3,1)' },
    },
  },
  plugins: [],
};

export default config;
