import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // Cho phép truy cập từ bên ngoài
    strictPort: true,
    port: 5173, // Cổng của Vite
    allowedHosts: [".ngrok-free.app"], // Thêm domain ngrok vào
  },
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
})
