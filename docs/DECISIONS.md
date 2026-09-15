# Architectural Decisions

- **Tailwind v4 vs v3**: Tailwind v4 with `@tailwindcss/vite` was chosen because it's the modern default for Vite projects and requires less configuration.
- **ESLint Flat Config**: We used ESLint 9 flat config (`eslint.config.js`) because it's the current standard.
- **Vitest configuration**: We put the `test` block in `vite.config.ts` using `vitest/config`'s `defineConfig` to keep configuration centralized.
