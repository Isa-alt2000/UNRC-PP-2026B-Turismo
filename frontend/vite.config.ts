import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/** Lee una variable del .env y falla al arrancar si falta, en lugar de usar un valor inventado. */
function requerida(env: Record<string, string>, nombre: string) {
  const valor = env[nombre]
  if (!valor) throw new Error(`Falta ${nombre} en frontend/.env (ver .env.example)`)
  return valor
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // El backend ya expone sus rutas bajo el prefijo, así que el proxy reenvía la ruta tal cual.
  const proxy = {
    [requerida(env, 'VITE_API_PREFIX')]: {
      target: requerida(env, 'BACKEND_URL'),
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 5173, strictPort: true, proxy },
  }
})
