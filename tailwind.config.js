/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#4f46e5",
                secondary: "#64748b",
                warning: "#f59e0b",
                error: "#ef4444",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'enterprise-card': '0 1px 3px rgba(0,0,0,0.03), 0 4px 20px rgba(79,70,229,0.04)',
                'enterprise-hover': '0 8px 40px rgba(79,70,229,0.10)',
                'premium': '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '24px',
                '4xl': '32px',
            },
        },
    },
    plugins: [],
}
