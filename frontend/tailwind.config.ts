import type { Config } from 'tailwindcss';

/** PERSONAL v2.0. Токены соответствуют docs/manifests/ui/tokens.md; сырые HEX в компонентах запрещены.
 *  Сетка и ритм взяты из пакета темы: контейнер 1240px, поля 20–76px, шаг секций 56–104px. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--c-paper)',
        'paper-2': 'var(--c-paper-2)',
        ink: 'var(--c-ink)',
        'ink-2': 'var(--c-ink-2)',
        lime: 'var(--c-lime)',
        terracotta: 'var(--c-terracotta)',
        techno: 'var(--c-blue)',
        line: 'var(--c-line)',
        'line-2': 'var(--c-line-2)',
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
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', pill: '999px' },
      maxWidth: { container: 'var(--shell-max)', narrow: '760px' },
      spacing: { gutter: 'var(--shell-gutter)', section: 'var(--space-section)' },
      boxShadow: { paper: 'var(--shadow-paper)' },
      transitionTimingFunction: { out: 'cubic-bezier(.16,1,.3,1)' },
    },
  },
  plugins: [],
};

export default config;
