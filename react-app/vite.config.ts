import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // 패키징된 Electron 앱은 file://로 index.html을 로드하므로, 기본값인
  // 절대경로("/assets/...")가 아니라 상대경로여야 JS/CSS가 정상 로드된다.
  base: "./",
  plugins: [
    tailwindcss(),
    react()
  ],
})
