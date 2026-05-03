import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas:   { DEFAULT: '#f7f7f4', soft: '#fafaf7' },
        surface:  { DEFAULT: '#ffffff', strong: '#e6e5e0' },
        ink:      '#26251e',
        body:     '#5a5852',
        muted:    { DEFAULT: '#807d72', soft: '#a09c92' },
        hairline: { DEFAULT: '#e6e5e0', soft: '#efeee8', strong: '#cfcdc4' },
        primary:  { DEFAULT: '#f54e00', active: '#d04200' },
        semantic: { success: '#1f8a65', error: '#cf2d56' },
        timeline: {
          thinking: '#dfa88f',
          grep:     '#9fc9a2',
          read:     '#9fbbe0',
          edit:     '#c0a8dd',
          done:     '#c08532',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px', pill: '9999px',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
        'fade-up':    'fade-up 0.4s ease forwards',
        'shimmer':    'shimmer 1.5s infinite',
      },
      backgroundImage: {
        'grid-pattern':    'linear-gradient(#efeee8 1px, transparent 1px), linear-gradient(90deg, #efeee8 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: { grid: '48px 48px' },
    },
  },
  plugins: [],
}

export default config
