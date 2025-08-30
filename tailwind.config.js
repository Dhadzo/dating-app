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
        xs: ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '-0.005em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.006em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.017em' }],
        xl: ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.019em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.028em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.032em' }],
        '5xl': ['3rem', { lineHeight: '3rem', letterSpacing: '-0.035em' }],
        '6xl': ['3.75rem', { lineHeight: '3.75rem', letterSpacing: '-0.04em' }]
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
