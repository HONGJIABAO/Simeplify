/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#faf6f1',
        paper: '#ffffff',
        brown: '#5c4033',
        sage: {
          50: '#f1f4ee',
          100: '#e0e6d9',
          200: '#c5d0b9',
          300: '#a8b896',
          400: '#8b9d77',
          500: '#6f8260',
          600: '#566549',
        },
        tan: {
          100: '#f6e8d8',
          300: '#e6c39b',
          400: '#d4a373',
          600: '#a97a4a',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          600: '#57534e',
          800: '#292524',
        },
      },
      fontFamily: {
        heading: ['Lora_600SemiBold', 'serif'],
        'heading-medium': ['Lora_500Medium', 'serif'],
        'heading-regular': ['Lora_400Regular', 'serif'],
        body: ['SourceSans3_400Regular', 'sans-serif'],
        'body-medium': ['SourceSans3_500Medium', 'sans-serif'],
        'body-semibold': ['SourceSans3_600SemiBold', 'sans-serif'],
        'body-bold': ['SourceSans3_700Bold', 'sans-serif'],
      },
      borderRadius: {
        '2rem': '32px',
        '1.25rem': '20px',
      },
      boxShadow: {
        sm: '0 1px 4px rgba(92, 64, 51, 0.06)',
        md: '0 2px 8px rgba(92, 64, 51, 0.12)',
      },
    },
  },
  plugins: [],
};
