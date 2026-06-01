import type { Config } from 'tailwindcss';

/**
 * Tailwind theme ánh xạ token thiết kế từ `open_design/css/app.css` (:root).
 * Đây là nguồn chân lý cho màu sắc, bo góc, bóng đổ và font của ứng dụng.
 */
const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        fg: '#111827',
        muted: '#6B7280',
        border: '#E5E7EB',
        primary: {
          DEFAULT: '#2563EB',
          weak: '#DBEAFE',
        },
        success: {
          DEFAULT: '#16A34A',
          weak: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#F59E0B',
          weak: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          weak: '#FEE2E2',
        },
        removed: {
          DEFAULT: '#6B7280',
          weak: '#F3F4F6',
        },
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(17, 24, 39, .08)',
      },
      fontFamily: {
        display: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        body: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
