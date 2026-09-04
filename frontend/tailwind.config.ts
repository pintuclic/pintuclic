import type { Config } from 'tailwindcss'
import { PINTUCLIC_COLORS } from './src/core/theme/colors'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens oficiales de diseño de Pintuclic
        corporate: PINTUCLIC_COLORS.corporate,
        action: PINTUCLIC_COLORS.action,
        subaction: PINTUCLIC_COLORS.subaction,
        conversion: PINTUCLIC_COLORS.conversion,
        highlight: PINTUCLIC_COLORS.highlight,
        neutral: PINTUCLIC_COLORS.neutral,
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
