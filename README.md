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

## Dados em tempo real

As telas leem os dados de arquivos CSV em `public/data/` e fazem *polling*
automático, então a interface se atualiza sozinha conforme os arquivos mudam:

- `public/data/navios.csv` — fila de navios
- `public/data/bercos.csv` — berços
- `public/data/indicadores.csv` — KPIs operacionais

**Como ver atualizando:** edite qualquer um desses CSVs (localmente ou no host
publicado) e salve — em poucos segundos o Dashboard, a Fila, os Berços e a
Recomendação refletem os novos valores. O cabeçalho mostra um indicador "ao vivo"
com o horário da última leitura.

Detalhes de implementação:

- `src/app/data/dataSource.ts` — busca e converte os CSVs (único ponto que conhece
  o formato bruto; para trocar por uma API REST ou WebSocket no futuro, altere só aqui).
- `src/app/data/DadosContext.tsx` — distribui os dados via React Context e faz o
  polling (um único polling alimenta todas as páginas). Se o fetch falhar, mantém
  os últimos dados válidos (semente em `mockData.ts`).
- Intervalo de atualização: 5s por padrão. Pode ser ajustado com a variável de
  ambiente `VITE_POLL_INTERVAL` (em milissegundos), ex.: `VITE_POLL_INTERVAL=3000`.

### Simulação ao vivo (opcional)

No cabeçalho há o botão **"Simular ao vivo"**. Ao ligá-lo, os números passam a
variar sozinhos a cada poucos segundos (random walk dentro de faixas plausíveis),
sem precisar editar nenhum arquivo — ideal para apresentações. Ao desligar, o app
volta a ler os CSVs reais.

- `src/app/data/simulacao.ts` — gera as variações sobre a base atual.
- Intervalo da simulação: 2,5s por padrão (`VITE_SIM_INTERVAL`, em ms).
