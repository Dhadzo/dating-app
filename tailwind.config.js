/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Roboto',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif'
        ]
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.1rem', letterSpacing: '-0.01em' }],
        sm: ['0.875rem', { lineHeight: '1.3rem', letterSpacing: '-0.01em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        lg: ['1.125rem', { lineHeight: '1.6rem', letterSpacing: '-0.015em' }],
        xl: ['1.25rem', { lineHeight: '1.7rem', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '1.9rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.1rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '2.4rem', letterSpacing: '-0.025em' }]
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800'
      },
      boxShadow: {
        'professional': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'professional-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'professional-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }
    }
  },
  plugins: []
};
