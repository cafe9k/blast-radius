/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          cyan: '#58a6ff', // GitHub accent blue
          purple: '#a371f7', // GitHub purple
          green: '#3fb950', // GitHub success green
        },
        background: {
          dark: '#0d1117', // GitHub canvas.default
          medium: '#161b22', // GitHub canvas.overlay
          light: '#21262d', // GitHub btn.bg
        },
        text: {
          primary: '#e6edf3', // GitHub fg.default
          secondary: '#8b949e', // GitHub fg.muted
          tertiary: '#7d8590', // GitHub fg.subtle
        },
        risk: {
          low: '#3fb950', // GitHub success
          medium: '#d29922', // GitHub warning
          high: '#f0883e', // GitHub orange
          critical: '#f85149', // GitHub danger
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(88, 166, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(88, 166, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
