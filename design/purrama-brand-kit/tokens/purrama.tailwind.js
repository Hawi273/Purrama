// Purrama Tailwind preset. Load css/purrama-tokens.css in your app, then:
//   module.exports = { presets: [require('./purrama.tailwind.js')], content: [...] }
// Colours point at the CSS variables, so data-theme="daylight" still works.
module.exports = {
  theme: {
    extend: {
      colors: {
        'surface-000': 'var(--surface-000)',
        'surface-100': 'var(--surface-100)',
        'surface-200': 'var(--surface-200)',
        'edge': 'var(--edge)',
        'hairline': 'var(--hairline)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'brand': 'var(--brand)',
        'on-brand': 'var(--on-brand)',
        'brand-soft': 'var(--brand-soft)',
        'accent': 'var(--accent)',
        'on-accent': 'var(--on-accent)',
        'cream': 'var(--cream)',
        'blush': 'var(--blush)',
        'cat-ink': 'var(--cat-ink)',
        'star-off': 'var(--star-off)',
        'focus': 'var(--focus)',
        'danger': 'var(--danger)'
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '7': 'var(--space-7)',
        '8': 'var(--space-8)'
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'pill': 'var(--radius-pill)'
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'hero': 'var(--shadow-hero)',
        'control': 'var(--shadow-control)',
        'pressed': 'var(--shadow-pressed)'
      },
      borderWidth: { edge: '2.5px', hair: '1.5px' },
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif']
      }
    }
  }
};
