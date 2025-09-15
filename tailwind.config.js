/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['DM Mono', 'monospace'],
      },
      colors: {
        'eco-green': '#10B981',
        'eco-blue': '#3B82F6',
        'eco-purple': '#8A5CF6',
        'eco-indigo': '#4F46E5',
        'custom-green': '#10b981',
        'custom-purple': '#5b21b6', // Updated to the original purple (violet-800)
        'bright-purple': '#7c3aed', // Keeping this as an option (violet-600)
        'eco-slate-900': '#0f172a',
        'deep-purple': '#4c1d95',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'purple-glow': 'purpleGlow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scale-in': 'scaleIn 0.5s ease-out',
        'spin-slow': 'spin 4s linear infinite',
        'gradient-shift': 'gradientShift 10s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'morph': 'morph 8s ease-in-out infinite alternate',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'bounce-slow': 'bounceSlow 6s infinite',
        'rotate-3d': 'rotate3d 8s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        purpleGlow: {
          '0%, 100%': { boxShadow: '0 0 15px 2px rgba(124, 58, 237, 0.2)' },
          '50%': { boxShadow: '0 0 20px 5px rgba(124, 58, 237, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: 0.8 },
          '50%': { opacity: 1 },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.05)' },
        },
        rotate3d: {
          '0%': { transform: 'rotateX(0deg) rotateY(0deg)' },
          '25%': { transform: 'rotateX(5deg) rotateY(5deg)' },
          '50%': { transform: 'rotateX(0deg) rotateY(10deg)' },
          '75%': { transform: 'rotateX(-5deg) rotateY(5deg)' },
          '100%': { transform: 'rotateX(0deg) rotateY(0deg)' },
        },
        morph: {
          '0%': { borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '40% 60%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 15px 2px rgba(124, 58, 237, 0.2)',
      },
    },
  },
  plugins: [],
}