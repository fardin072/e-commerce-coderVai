import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react-swc"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const backendUrl = env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/medusa": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/medusa/, ""),
        },
      },
    },
  }
})



