# PortoFlow 4.0 — Sistema Inteligente de Atracação

Versão codada do design/protótipo do Figma (**PortoFlow 4.0 Dashboard Prototype**).
Aplicação web para otimização de atracação de navios no Porto do Itaqui, com dados
em tempo real, priorização dinâmica e recomendações operacionais.

Original no Figma: https://www.figma.com/design/26FICkH62Ncz13OKt7UHzF/PortoFlow-4.0-Dashboard-Prototype

## Stack

- **React 18** + **React Router 7**
- **Vite 6** (build/dev server)
- **Tailwind CSS v4**
- **Recharts** (gráficos) e **lucide-react** (ícones)

## Rodando localmente

Pré-requisito: Node.js 18+ instalado.

```bash
npm install      # instala as dependências
npm run dev      # inicia o servidor de desenvolvimento (http://localhost:5173)
```

## Build de produção

```bash
npm run build    # gera os arquivos estáticos em dist/
npm run preview  # serve o build localmente para conferência
```

O conteúdo gerado fica na pasta `dist/` — basta publicá-la em qualquer host de
sites estáticos.

## Publicando

O projeto é uma SPA (single-page app) e já inclui os arquivos de configuração
para os principais hosts:

- **Netlify**: `netlify.toml` (build `npm run build`, publica `dist/`, com
  fallback de rotas para `index.html`).
- **Vercel**: `vercel.json` (mesma configuração com rewrites).

Em ambos, basta conectar o repositório que a publicação é automática. Para outros
hosts, configure o servidor para servir `index.html` em todas as rotas
(fallback de SPA), garantindo que `/bercos`, `/fila`, etc. funcionem ao recarregar.

## Páginas

- `/` — Dashboard (Home)
- `/bercos` — Berços
- `/fila` — Fila de Navios
- `/simulacao` — Simulação
- `/recomendacao` — Recomendação
