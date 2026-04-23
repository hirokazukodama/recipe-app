const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto)', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: { 50: '#FCFAF7', 100: '#F7F2EA', 200: '#EFE7DA' },
        ink:   { 900: '#1A1614', 700: '#2E2825', 500: '#6B635E', 300: '#B5ADA7' },
        coral: {
          50:  '#FFF3EF', 100: '#FFE2D9',
          300: '#F5A08F', 500: '#E65F4D',
          600: '#D44A37', 700: '#B23A29',
        },
        forest: { 500: '#3A6B4C', 700: '#2B4F38' },
        line: '#EFE9E2',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(26,22,20,0.04), 0 4px 20px -8px rgba(26,22,20,0.08)',
        cta:  '0 1px 0 rgba(255,255,255,0.25) inset, 0 10px 24px -10px rgba(230,95,77,0.55)',
      },
    },
  },
  plugins: [],
};
export default config;
