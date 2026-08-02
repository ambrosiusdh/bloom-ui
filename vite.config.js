/* eslint-env node */
import path from "path";

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    return {
        plugins: [react()],

        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@api': path.resolve(__dirname, './src/api'),
                '@components': path.resolve(__dirname, './src/components'),
                '@constants': path.resolve(__dirname, './src/constants'),
                '@pages': path.resolve(__dirname, './src/pages'),
                '@stores': path.resolve(__dirname, './src/stores'),
                '@utils': path.resolve(__dirname, './src/utils')
            }
        },

        server: {
            proxy: {
                '/api': {
                    target: env.VITE_BE_API_URL,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },

        test: {
            environment: 'jsdom',
            setupFiles: './src/test/setup.js',
            css: true,
        },
    }
})
