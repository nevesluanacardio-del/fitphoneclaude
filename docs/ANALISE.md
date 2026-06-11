# PortoFlow 4.0 — Análise Completa do Projeto

> Documento de apoio à apresentação (banca). Aborda o sistema como solução do
> **DESAFIO 4.0 — Teoria das Filas** (Porto do Itaqui: congestionamento e
> priorização de atracação).

---

## ETAPA 1 — Entendimento geral

**Problema (desafio):** o Porto do Itaqui sofre com filas de atracação por alta
demanda. O sequenciamento atual não lida com incertezas (chegada aleatória,
clima, tempos de operação distintos por carga, prioridades legais/contratuais,
restrição de berços). A autoridade quer reduzir espera, evitar congestionamento e
ociosidade, garantir atendimento prioritário e prever cenários críticos.

**Solução (PortoFlow 4.0):** painel de inteligência operacional que (a) **simula a
fila de atracação ao vivo** (M/G/4), (b) prioriza navios por um **Índice Dinâmico
de Atracação (IDA)**, (c) **compara políticas** de sequenciamento por **simulação
de eventos discretos** e (d) emite **recomendações** operacionais.

**Telas (6):**
| Rota | Função |
|---|---|
| `/` Dashboard | KPIs ao vivo (espera, fila, utilização, atraso crítico, risco climático, congestionamento) |
| `/bercos` Berços | 4 servidores: status, navio em operação, previsão de liberação, **interrupção por clima** |
| `/fila` Fila de Navios | clientes aguardando, ordenados por prioridade/IDA |
| `/modelo` **Modelo de Fila** | λ, μ, ρ, métricas M/M/1 por tipo e M/M/c (Erlang-C) |
| `/simulacao` Simulação | comparação das 4 políticas por **DES** (Wq, Lq, ρ, custo ponderado) |
| `/recomendacao` Recomendação | próxima atracação ótima + justificativa + timeline |

---

## ETAPA 2 — Arquitetura técnica

```
api/_lib/
  baseDados.ts    tipos + nomes/tipos/capacidades dos berços
  gerarDados.ts   SIMULAÇÃO M/G/4 ao vivo (snapshot estocástico no tempo)
  clima.ts        clima real (Open-Meteo) + interrupção de operação
  obterDados.ts   compõe simulação + clima (ponto único)
  dados.ts        endpoint serverless (Vercel)
server/           coletor AIS (WebSocket aisstream) — navios reais opcionais
src/app/
  lib/filas/
    modelo.ts     parâmetros λ, μ, ρ + fórmulas M/M/1 e M/M/c (Erlang-C)
    des.ts        Simulação de Eventos Discretos: compara 4 políticas
  data/
    dataSource.ts consome /api/dados
    DadosContext.tsx  estado global + polling + botão Acelerar
  pages/          as 6 telas
```

- **Estado:** React Context (`DadosContext`) com **um único polling** alimentando
  todas as telas; semente em `mockData.ts` como fallback.
- **Lógica de filas:** `api/_lib/gerarDados.ts` (sistema ao vivo) e
  `src/app/lib/filas/` (modelo analítico + DES de comparação).
- **Bibliotecas:** React 18 + React Router 7, Vite 6, Tailwind v4, Recharts,
  lucide-react, motion; `ws`/`tsx`/`dotenv` (coletor AIS).

---

## ETAPA 3 — Teoria das Filas

| Conceito | No sistema | Onde no código |
|---|---|---|
| **Clientes** | navios aguardando | fila em `gerarDados`/`FilaNavios` |
| **Servidores (c=4)** | os 4 berços | `baseBercos`, `snapshot()` |
| **Chegada** | Poisson por tipo (λ) | `gerarChegadas()` (intervalos exponenciais) |
| **Atendimento** | exponencial por tipo (μ) | `SERVICO_H`, `expo()` |
| **Saída** | navio desatraca (berço→livre) | evento de fim de serviço |
| **Disciplina** | **prioridade não preemptiva** + compatibilidade | `despachar()`/`selecionar()` |
| **Filas paralelas/restrição** | berço por tipo; B4 flexível (transbordo) | `COMPAT` |
| **Capacidade** | fila ilimitada (fundeadouro) | sem bloqueio K |

- **λ, μ, ρ:** explícitos na aba **Modelo de Fila** (`modelo.ts`): por tipo
  (M/M/1) e agregado (M/M/c, Erlang-C: P₀, P(espera), Wq, Lq, L, W).
- **Modelo:** **M/G/4 com prioridade não preemptiva e servidores restritos**.
  FIFO aparece apenas como baseline de comparação.

---

## ETAPA 4 — Processos Estocásticos

- **Chegadas aleatórias:** processo de **Poisson** (intervalos exponenciais) no
  simulador ao vivo e no DES; ou **AIS real** (aisstream) quando configurado.
- **Tempos de atendimento variáveis:** **exponenciais com μ por tipo de carga**
  (Grãos 18h, Contêineres 12h, Combustíveis 10h, Multiuso 8h).
- **Clima:** entrada **exógena estocástica real** (Open-Meteo) que classifica o
  risco e, quando **Desfavorável**, **interrompe a operação** dos berços ocupados
  (`aplicarClima`).
- **Evolução do sistema:** o estado dos berços e da fila é resultado de um
  **processo de nascimento-e-morte** simulado por eventos discretos. O dashboard
  exibe um *snapshot* desse processo a cada *polling* (o botão **Acelerar** adianta
  o relógio).

> Observação honesta: a simulação é **semeada** (reprodutível). Isso a torna
> determinística *dada a semente*, mas o **mecanismo é estocástico** (Poisson +
> exponencial). O AIS, quando ligado, traz aleatoriedade do mundo real.

---

## ETAPA 5 — Requisitos do desafio (Parte 2)

| # | Requisito | Atendimento | Evidência | Nota |
|---|---|---|---|---|
| 1 | Definir o modelo de fila | **M/G/4 prioridade não preemptiva** explicitado | aba Modelo de Fila; `gerarDados`/`des.ts` | **9** |
| 2 | Identificar λ, μ, disciplina, capacidade, prioridades | todos calculados/exibidos | `modelo.ts` (λ,μ,ρ,Erlang-C); `selecionar()` (prioridade) | **9** |
| 3 | Justificar o tipo de fila | comparação **por simulação** FIFO×Prioridade×Tipo×IDA | aba Simulação; `des.ts` | **8.5** |
| 4 | Simular cenários, prever, comparar políticas | **DES** com cenários Normal/Pico, Wq/Lq/ρ, re-amostragem | `des.ts`; `Simulacao.tsx` | **9** |
| 5 | Propor política ótima, redução de congestionamento, redistribuição entre berços, plano crítico, recomendações | IDA + alocação por prioridade + Recomendação + transbordo B4 | `gerarDados`, `Recomendacao.tsx` | **8.5** |

**Resultado-chave (defensável):** entre políticas conservativas a **espera média
(Wq) é parecida** (conservação de trabalho); o **Índice Dinâmico vence onde
importa** — minimiza a **espera dos navios críticos** e o **custo ponderado por
prioridade**, e o FIFO (fila única com bloqueio de cabeça) é claramente o pior.

---

## ETAPA 6 — Guia para apresentação

**Simples:** "Modelamos a fila de atracação do Itaqui e construímos o painel que a
opera: ele simula navios chegando e atracando em 4 berços, prioriza por um índice
e mostra que priorizar bem protege os navios críticos sem piorar o tempo médio."

**Técnica:** "M/G/4 com prioridade não preemptiva e restrição de berço. O backend
é uma simulação de eventos discretos cujo *snapshot* alimenta o dashboard; a aba
Simulação roda a mesma carga sob 4 políticas e mede Wq, Lq, ρ e custo ponderado."

**Matemática:** "λ por tipo (Poisson), μ por tipo (exponencial), ρ=λ/μ. Na aba
Modelo mostramos M/M/1 por berço e M/M/c agregado (Erlang-C: P(espera), Wq, Lq).
O IDA é um score multicritério (0–100): prioridade legal/contratual + espera + tipo de carga + clima + impacto logístico + compatibilidade de berço."

**Perguntas prováveis e respostas:**
- *"O IDA reduz a espera média?"* → "Não necessariamente — por conservação de
  trabalho, políticas conservativas empatam em Wq. O IDA reduz a **espera
  ponderada** e protege os críticos; é esse o objetivo da priorização."
- *"Onde estão λ e μ?"* → "Na aba Modelo de Fila, por tipo e agregados."
- *"O dashboard é real ou simulado?"* → "É uma simulação estocástica M/G/4 ao
  vivo; opcionalmente, navios reais via AIS."
- *"Como o clima entra?"* → "Dado real do Open-Meteo; quando desfavorável,
  interrompe a operação dos berços."

**Pontos fortes:** modelo de filas implementado de verdade (DES + analítico);
prioridade e restrição de berço reais; comparação honesta e reprodutível; dados
reais opcionais (AIS, clima); arquitetura limpa e publicável.

**Críticas possíveis e defesa:**
- *"Service exponencial é simplificação."* → "Sim; a estrutura M/G permite trocar
  por log-normal/empírica sem mudar o motor."
- *"Simulação semeada."* → "Reprodutibilidade para a banca; o botão Re-simular
  troca a semente e o AIS traz aleatoriedade real."

---

## ETAPA 7 — Resumo executivo

**Desenvolvido:** painel web (React/Vite/Tailwind) com **backend de simulação de
filas** próprio. Dashboard ao vivo (M/G/4 estocástico), aba **Modelo de Fila**
(λ, μ, ρ, M/M/1, Erlang-C), aba **Simulação** (DES comparando 4 políticas),
**Recomendação** (IDA), navios reais via **AIS** e **clima real** (Open-Meteo).

**Teoria das Filas aplicada:** multi-servidor c=4; prioridade não preemptiva;
filas paralelas com restrição/transbordo; comparação de políticas; métricas
Wq, Lq, L, W, ρ, P(espera) (analíticas e simuladas).

**Processos Estocásticos aplicados:** chegadas de Poisson; serviço exponencial por
tipo; clima exógeno real; processo de nascimento-e-morte via eventos discretos.

**Requisitos:** R1 9 · R2 9 · R3 8.5 · R4 9 · R5 8.5.

**Melhorias futuras (não impeditivas):** tempos de serviço gerais (não
exponenciais) calibrados com dados reais; prioridade contratual explícita por
empresa/berço; persistência histórica para validar o modelo contra a operação
real do porto.
