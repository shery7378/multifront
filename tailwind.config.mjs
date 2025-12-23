import scrollbar from 'tailwind-scrollbar';

export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",         // ✅ Pages and layouts in app directory
    "./src/components/**/*.{js,ts,jsx,tsx}",  // ✅ Your components
    "./src/pages/**/*.{js,ts,jsx,tsx}",       // Optional if using `pages/`
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F44422',
          dark: '#d6391a',
        },
      },
    },
  },
  plugins: [scrollbar()],
};
