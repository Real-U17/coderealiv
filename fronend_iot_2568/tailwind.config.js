module.exports = {
    content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
    ],
    theme: {
        extend: {},
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                light: {
                    ...require("daisyui/src/theming/themes")["light"],
                    primary: "#3b82f6",
                    secondary: "#10b981",
                    accent: "#6366f1",
                },
                dark: {
                    ...require("daisyui/src/theming/themes")["dark"],
                    primary: "#60a5fa",
                    secondary: "#34d399",
                    accent: "#818cf8",
                },
            },
        ],
    },
}