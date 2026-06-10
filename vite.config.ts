import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { obterDados } from './api/_lib/obterDados'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Serve a API (/api/dados) durante `vite dev` e `vite preview`, usando o mesmo
// gerador que roda em produção (Vercel/Netlify). Assim a API funciona localmente
// sem precisar de runtime serverless.
function apiDevServer() {
  const handle = async (req: any, res: any, next: any) => {
    const [path, query] = (req.url || '').split('?')
    if (path === '/api/dados') {
      const acel = Number(new URLSearchParams(query || '').get('aceleracao')) || 1
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(await obterDados(Date.now(), acel)))
      return
    }
    next()
  }
  return {
    name: 'api-dev-server',
    configureServer(server: any) { server.middlewares.use(handle) },
    configurePreviewServer(server: any) { server.middlewares.use(handle) },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    apiDevServer(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
