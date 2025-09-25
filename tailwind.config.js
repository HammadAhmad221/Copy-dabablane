/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',
    ],
    theme: {
      extend: {
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
        },
        colors: {
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))',
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))',
          },
          primary: {
            DEFAULT: '#F26666',
            light: '#2a8f85',
            dark: '#145c55',
            foreground: 'hsl(var(--primary-foreground))',
          },
          secondary: {
            DEFAULT: '#19736A',
            light: '#f47c7c',
            dark: '#e65151',
            foreground: 'hsl(var(--secondary-foreground))',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))',
          },
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          chart: {
            1: 'hsl(var(--chart-1))',
            2: 'hsl(var(--chart-2))',
            3: 'hsl(var(--chart-3))',
            4: 'hsl(var(--chart-4))',
            5: 'hsl(var(--chart-5))',
          },
          coral: '#F26666',
          teal: '#19736A',
          'coral-light': '#ff8080',
          'teal-light': '#239189'
        },
        keyframes: {
          'accordion-down': {
            from: {
              height: '0',
            },
            to: {
              height: 'var(--radix-accordion-content-height)',
            },
          },
          'accordion-up': {
            from: {
              height: 'var(--radix-accordion-content-height)',
            },
            to: {
              height: '0',
            },
          },
          "tab-content": {
            "0%": { opacity: 0, transform: "translateY(10px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
          enter: {
            '0%': { transform: 'scale(0.9)', opacity: 0 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
          leave: {
            '0%': { transform: 'scale(1)', opacity: 1 },
            '100%': { transform: 'scale(0.9)', opacity: 0 },
          },
        },
        animation: {
          'accordion-down': 'accordion-down 0.2s ease-out',
          'accordion-up': 'accordion-up 0.2s ease-out',
          "tab-content": "tab-content 0.3s ease-out",
          enter: 'enter 200ms ease-out',
          leave: 'leave 150ms ease-in forwards',
        },
      },
    },
    plugins: [
      require('tailwindcss-animate'),
    ],
  };