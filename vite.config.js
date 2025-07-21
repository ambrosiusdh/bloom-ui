/* eslint-env node */
import react from '@vitejs/plugin-react'
import path from "path";
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = process.env
    return {
        plugins: [react()],

        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@api': path.resolve(__dirname, './src/api'),
                '@components': path.resolve(__dirname, './src/components'),
                '@pages': path.resolve(__dirname, './src/pages'),
                '@store': path.resolve(__dirname, './src/store'),
            }
        },

        server: {
            proxy: {
                '/api': {
                    target: env.BE_API_URL,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    }
})
