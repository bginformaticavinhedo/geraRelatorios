import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#0f172a", // Slate 900
                    foreground: "#f8fafc",
                },
                secondary: {
                    DEFAULT: "#f1f5f9", // Slate 100
                    foreground: "#0f172a",
                },
                accent: {
                    DEFAULT: "#0d9488", // Teal 600
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "#64748b", // Slate 500
                    foreground: "#f8fafc",
                },
                border: "#e2e8f0", // Slate 200
            },
            borderRadius: {
                lg: "0.25rem", // 4px - Sharp/Professional
                md: "0.125rem", // 2px
                sm: "0.125rem",
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
