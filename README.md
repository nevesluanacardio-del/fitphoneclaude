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

## Dados em tempo real (API própria)

O projeto inclui o **próprio backend** — uma API que serve os dados operacionais
em JSON e já varia suavemente ao longo do tempo, então a interface se atualiza
sozinha. Não é preciso nenhum serviço externo.

### Endpoint

```
GET /api/dados
```

Retorna `{ geradoEm, navios[], bercos[], indicadores }`. Os valores oscilam de
forma suave e determinística no tempo (sem manter estado entre requisições — ideal
para funções serverless), dando a sensação de operação ao vivo a cada *polling*.

A mesma rota funciona em **três ambientes**, sempre com o mesmo gerador
(`api/_lib/gerarDados.ts`):

- **`npm run dev` / `npm run preview`** — servida por um middleware do Vite
  (`vite.config.ts` → `apiDevServer`).
- **Vercel** — função serverless em `api/dados.ts` (zero-config).
- **Netlify** — função em `netlify/functions/dados.ts`, exposta como `/api/dados`
  via redirect no `netlify.toml`.

A "base de dados" do backend fica em `api/_lib/baseDados.ts` — edite ali para mudar
navios, berços e indicadores.

### No front-end

- `src/app/data/dataSource.ts` — consome `/api/dados` e converte o JSON para os
  tipos da aplicação (único ponto que conhece o formato da API). Para apontar para
  um backend externo, defina `VITE_API_URL`.
- `src/app/data/DadosContext.tsx` — distribui os dados via React Context e faz o
  *polling* (um único polling alimenta todas as páginas). Se a API falhar, mantém
  os últimos dados válidos (semente em `mockData.ts`) e sinaliza no cabeçalho.
- Intervalo de *polling*: 5s por padrão (`VITE_POLL_INTERVAL`, em ms).

### Simulação ao vivo (opcional)

No cabeçalho há o botão **"Simular ao vivo"**. Ao ligá-lo, o app pausa o consumo da
API e passa a variar os números localmente a cada poucos segundos (random walk),
útil para demonstrações offline. Ao desligar, volta a consumir a API.

- `src/app/data/simulacao.ts` — gera as variações sobre a base atual.
- Intervalo da simulação: 2,5s por padrão (`VITE_SIM_INTERVAL`, em ms).
