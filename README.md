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

Retorna `{ geradoEm, navios[], bercos[], indicadores, clima }`. O estado é o
**snapshot de uma simulação M/G/4 ao vivo** (`api/_lib/gerarDados.ts`): chegadas de
Poisson por tipo de carga, atendimento exponencial por berço, prioridade não
preemptiva e compatibilidade de berço. A simulação é semeada (determinística por
semente) e o estado no instante `now` é obtido reproduzindo os eventos até o tempo
simulado correspondente — por isso é **estocástica e sem estado** entre requisições
(ideal para funções serverless). A cada *polling* o sistema evolui: navios chegam,
atracam (saindo da fila) e liberam berços.

`GET /api/dados?aceleracao=N` adianta o relógio da simulação (fast-forward) — é o
que o botão **Acelerar** no cabeçalho usa.

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
- Intervalo de *polling*: 5s por padrão (`VITE_POLL_INTERVAL`, em ms). O botão
  **Acelerar** faz fast-forward (fator `VITE_ACELERACAO`, padrão 8).

### Modelo de fila e simulação de políticas

Além do dashboard ao vivo, há a aba **Modelo de Fila** (parâmetros analíticos
λ, μ, ρ, M/M/1 por tipo e M/M/c via Erlang-C) e a aba **Simulação**, que roda uma
**Simulação de Eventos Discretos** (`src/app/lib/filas/`) comparando 4 políticas
(FIFO, Prioridade Fixa, Fila por Tipo, Índice Dinâmico) com Wq, Lq, ρ e custo
ponderado por prioridade. Os números dessas telas são **calculados**, não fixos.

### Navios reais via AIS (aisstream.io)

Dá para alimentar a **Fila de Navios com dados reais** das embarcações que se
aproximam do Porto do Itaqui, usando o AIS (sinal que os navios transmitem com
identificação, posição, rumo e velocidade) via [aisstream.io](https://aisstream.io)
— gratuito.

Como o AIS exige uma conexão WebSocket persistente, ele **não roda em função
serverless**. Por isso há um serviço Node à parte — o "coletor" — que mantém a
conexão, acumula as embarcações na Baía de São Marcos e expõe o **mesmo**
`/api/dados`:

```bash
# 1) gere uma chave grátis em https://aisstream.io (login GitHub)
# 2) crie seu .env (ignorado pelo Git) e preencha a chave:
cp .env.example .env        # edite e defina AISSTREAM_API_KEY=...
# 3) rode o coletor (carrega o .env automaticamente):
npm run ais                 # sobe em http://localhost:8787
# 4) aponte o app para o coletor:
VITE_API_URL=http://localhost:8787/api/dados npm run dev
```

Sem a variável `AISSTREAM_API_KEY`, o coletor continua funcionando e serve os
dados **simulados** (o app nunca fica sem resposta). A resposta inclui um campo
`fonte`: `"ais"` (navios reais), `"ais-aguardando"` (conectado, ainda sem navios)
ou `"simulado"`.

O que vem do AIS e o que é estimado:

- **Medido pelo AIS:** nome, tipo da embarcação, posição, velocidade, dimensões, calado.
- **Estimado/calculado** (o AIS não transmite): `tempoEspera` (a partir de
  ancoragem/ETA), `tipoCarga` (heurística por tipo e nome), `cargaToneladas`
  (via calado), `prioridade` e `indiceDinamico` (nosso algoritmo). Veja
  `server/aisMapping.ts`.

**Publicação (Render):** o coletor precisa de um host que mantenha um processo
Node de pé (Render, Railway, Fly.io, uma VM…). O repositório já traz um blueprint
`render.yaml` — no Render, **New → Blueprint**, aponte para este repo, e ele cria o
serviço com `npm install` / `npm run ais`, pedindo apenas o valor de
`AISSTREAM_API_KEY` (que fica guardado como segredo, fora do Git). Depois aponte o
front-end (`VITE_API_URL`) para a URL pública do serviço. Os berços continuam vindo
do gerador (não há feed público em tempo real para ocupação de berços — isso é dado
interno da EMAP).

### Simulação ao vivo (opcional)

No cabeçalho há o botão **"Simular ao vivo"**. Ao ligá-lo, o app pausa o consumo da
API e passa a variar os números localmente a cada poucos segundos (random walk),
útil para demonstrações offline. Ao desligar, volta a consumir a API.

- `src/app/data/simulacao.ts` — gera as variações sobre a base atual.
- Intervalo da simulação: 2,5s por padrão (`VITE_SIM_INTERVAL`, em ms).
