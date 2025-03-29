import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

import vueJsx from '@vitejs/plugin-vue-jsx';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx({
      runtimeOnly: false,
      transformOn: true
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'cropperjs/dist/cropper.css': fileURLToPath(new URL('./node_modules/cropperjs/dist/cropper.css', import.meta.url))

    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174
  }
})
