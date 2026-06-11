import fitz

HTML = """
<div class="cover">
  <div class="badge">DESAFIO 4.0 · Teoria das Filas — UNDB 2026.1</div>
  <h1 class="title">PortoFlow 4.0</h1>
  <p class="sub">Sistema Inteligente de Atracação — Porto do Itaqui</p>
  <p class="sub2">Análise completa do projeto · Teoria das Filas &amp; Processos Estocásticos</p>
</div>

<h2>Etapa 1 — Entendimento geral</h2>
<p><b>Problema (desafio):</b> o Porto do Itaqui sofre com filas de atracação por alta demanda. O sequenciamento atual não lida com incertezas (chegada aleatória, clima, tempos de operação distintos por carga, prioridades legais/contratuais, restrição de berços). A autoridade quer reduzir espera, evitar congestionamento e ociosidade, garantir atendimento prioritário e prever cenários críticos.</p>
<p><b>Solução (PortoFlow 4.0):</b> painel de inteligência operacional que (a) <b>simula a fila de atracação ao vivo</b> (M/G/4), (b) prioriza navios por um <b>Índice Dinâmico de Atracação (IDA)</b>, (c) <b>compara políticas</b> de sequenciamento por <b>simulação de eventos discretos</b> e (d) emite <b>recomendações</b> operacionais.</p>
<table>
<tr><th>Tela</th><th>Função</th></tr>
<tr><td>/ Dashboard</td><td>KPIs ao vivo (espera, fila, utilização, atraso crítico, risco climático, congestionamento)</td></tr>
<tr><td>/bercos Berços</td><td>4 servidores: status, navio em operação, previsão de liberação, interrupção por clima</td></tr>
<tr><td>/fila Fila de Navios</td><td>clientes aguardando, ordenados por prioridade/IDA</td></tr>
<tr><td>/modelo Modelo de Fila</td><td>λ, μ, ρ, métricas M/M/1 por tipo e M/M/c (Erlang-C)</td></tr>
<tr><td>/simulacao Simulação</td><td>comparação das 4 políticas por DES (Wq, Lq, ρ, custo ponderado)</td></tr>
<tr><td>/recomendacao Recomendação</td><td>próxima atracação ótima + justificativa + timeline</td></tr>
</table>

<h2>Etapa 2 — Arquitetura técnica</h2>
<pre>api/_lib/
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
    dataSource.ts      consome /api/dados
    DadosContext.tsx   estado global + polling + botão Acelerar
  pages/          as 6 telas</pre>
<ul>
<li><b>Estado:</b> React Context (DadosContext) com um único polling alimentando todas as telas; semente em mockData.ts como fallback.</li>
<li><b>Lógica de filas:</b> api/_lib/gerarDados.ts (sistema ao vivo) e src/app/lib/filas/ (modelo analítico + DES de comparação).</li>
<li><b>Bibliotecas:</b> React 18 + React Router 7, Vite 6, Tailwind v4, Recharts, lucide-react, motion; ws/tsx/dotenv (coletor AIS).</li>
</ul>

<h2>Etapa 3 — Teoria das Filas</h2>
<table>
<tr><th>Conceito</th><th>No sistema</th><th>Onde no código</th></tr>
<tr><td>Clientes</td><td>navios aguardando</td><td>fila em gerarDados / FilaNavios</td></tr>
<tr><td>Servidores (c=4)</td><td>os 4 berços</td><td>baseBercos, snapshot()</td></tr>
<tr><td>Chegada</td><td>Poisson por tipo (λ)</td><td>gerarChegadas() — intervalos exponenciais</td></tr>
<tr><td>Atendimento</td><td>exponencial por tipo (μ)</td><td>SERVICO_H, expo()</td></tr>
<tr><td>Saída</td><td>navio desatraca (berço→livre)</td><td>evento de fim de serviço</td></tr>
<tr><td>Disciplina</td><td>prioridade não preemptiva + compatibilidade</td><td>despachar() / selecionar()</td></tr>
<tr><td>Filas paralelas/restrição</td><td>berço por tipo; B4 flexível (transbordo)</td><td>COMPAT</td></tr>
<tr><td>Capacidade</td><td>fila ilimitada (fundeadouro)</td><td>sem bloqueio K</td></tr>
</table>
<p><b>λ, μ, ρ</b> são explícitos na aba Modelo de Fila (modelo.ts): por tipo (M/M/1) e agregado (M/M/c, Erlang-C: P₀, P(espera), Wq, Lq, L, W). <b>Modelo:</b> M/G/4 com prioridade não preemptiva e servidores restritos. FIFO aparece apenas como baseline.</p>

<h2>Etapa 4 — Processos Estocásticos</h2>
<ul>
<li><b>Chegadas aleatórias:</b> processo de Poisson (intervalos exponenciais) no simulador ao vivo e no DES; ou AIS real (aisstream) quando configurado.</li>
<li><b>Tempos de atendimento variáveis:</b> exponenciais com μ por tipo (Grãos 18h, Contêineres 12h, Combustíveis 10h, Multiuso 8h).</li>
<li><b>Clima:</b> entrada exógena estocástica real (Open-Meteo); quando Desfavorável, interrompe a operação dos berços ocupados (aplicarClima).</li>
<li><b>Evolução:</b> processo de nascimento-e-morte simulado por eventos discretos; o dashboard mostra um snapshot a cada polling (botão Acelerar adianta o relógio).</li>
</ul>
<p class="note"><b>Honestidade:</b> a simulação é semeada (reprodutível) — determinística dada a semente, mas o mecanismo é estocástico (Poisson + exponencial). O AIS, quando ligado, traz aleatoriedade do mundo real.</p>

<h2>Etapa 5 — Requisitos do desafio (Parte 2)</h2>
<table>
<tr><th>#</th><th>Requisito</th><th>Evidência</th><th>Nota</th></tr>
<tr><td>1</td><td>Definir o modelo de fila</td><td>aba Modelo; gerarDados / des.ts</td><td>9</td></tr>
<tr><td>2</td><td>Identificar λ, μ, disciplina, capacidade, prioridades</td><td>modelo.ts; selecionar()</td><td>9</td></tr>
<tr><td>3</td><td>Justificar o tipo de fila</td><td>aba Simulação; des.ts</td><td>8.5</td></tr>
<tr><td>4</td><td>Simular cenários, prever, comparar políticas</td><td>des.ts; Simulacao.tsx</td><td>9</td></tr>
<tr><td>5</td><td>Propor política ótima, redução de congestionamento, redistribuição, plano crítico, recomendações</td><td>gerarDados; Recomendacao.tsx</td><td>8.5</td></tr>
</table>
<p class="key"><b>Resultado-chave (defensável):</b> entre políticas conservativas a espera média (Wq) é parecida (conservação de trabalho); o Índice Dinâmico vence onde importa — minimiza a espera dos navios críticos e o custo ponderado por prioridade, e o FIFO (fila única com bloqueio de cabeça) é claramente o pior.</p>

<h2>Etapa 6 — Guia para apresentação</h2>
<p><b>Simples:</b> "Modelamos a fila de atracação do Itaqui e construímos o painel que a opera: ele simula navios chegando e atracando em 4 berços, prioriza por um índice e mostra que priorizar bem protege os navios críticos sem piorar o tempo médio."</p>
<p><b>Técnica:</b> "M/G/4 com prioridade não preemptiva e restrição de berço. O backend é uma simulação de eventos discretos cujo snapshot alimenta o dashboard; a aba Simulação roda a mesma carga sob 4 políticas e mede Wq, Lq, ρ e custo ponderado."</p>
<p><b>Matemática:</b> "λ por tipo (Poisson), μ por tipo (exponencial), ρ=λ/μ. Na aba Modelo mostramos M/M/1 por berço e M/M/c agregado (Erlang-C: P(espera), Wq, Lq). O IDA é um score multicritério (0–100): prioridade + espera + tipo de carga + clima + impacto logístico + compatibilidade."</p>
<p><b>Perguntas prováveis e respostas:</b></p>
<ul>
<li><i>"O IDA reduz a espera média?"</i> → "Não necessariamente — por conservação de trabalho, políticas conservativas empatam em Wq. O IDA reduz a espera ponderada e protege os críticos; é esse o objetivo da priorização."</li>
<li><i>"Onde estão λ e μ?"</i> → "Na aba Modelo de Fila, por tipo e agregados."</li>
<li><i>"O dashboard é real ou simulado?"</i> → "Simulação estocástica M/G/4 ao vivo; opcionalmente, navios reais via AIS."</li>
<li><i>"Como o clima entra?"</i> → "Dado real do Open-Meteo; quando desfavorável, interrompe a operação dos berços."</li>
</ul>
<p><b>Pontos fortes:</b> modelo de filas implementado de verdade (DES + analítico); prioridade e restrição de berço reais; comparação honesta e reprodutível; dados reais opcionais (AIS, clima); arquitetura limpa e publicável.</p>
<p><b>Críticas possíveis e defesa:</b></p>
<ul>
<li><i>"Serviço exponencial é simplificação."</i> → "Sim; a estrutura M/G permite trocar por log-normal/empírica sem mudar o motor."</li>
<li><i>"Simulação semeada."</i> → "Reprodutibilidade para a banca; o botão Re-simular troca a semente e o AIS traz aleatoriedade real."</li>
</ul>

<h2>Etapa 7 — Resumo executivo</h2>
<p><b>Desenvolvido:</b> painel web (React/Vite/Tailwind) com backend de simulação de filas próprio. Dashboard ao vivo (M/G/4 estocástico), aba Modelo de Fila (λ, μ, ρ, M/M/1, Erlang-C), aba Simulação (DES comparando 4 políticas), Recomendação (IDA), navios reais via AIS e clima real (Open-Meteo).</p>
<p><b>Teoria das Filas:</b> multi-servidor c=4; prioridade não preemptiva; filas paralelas com restrição/transbordo; comparação de políticas; métricas Wq, Lq, L, W, ρ, P(espera) (analíticas e simuladas).</p>
<p><b>Processos Estocásticos:</b> chegadas de Poisson; serviço exponencial por tipo; clima exógeno real; processo de nascimento-e-morte via eventos discretos.</p>
<p><b>Requisitos:</b> R1 9 · R2 9 · R3 8.5 · R4 9 · R5 8.5.</p>
<p><b>Melhorias futuras:</b> tempos de serviço gerais calibrados com dados reais; prioridade contratual explícita por empresa/berço; persistência histórica para validar o modelo contra a operação real do porto.</p>
"""

CSS = """
body { font-family: sans-serif; font-size: 10.5px; color: #1e293b; line-height: 1.45; }
.cover { background-color: #1e3a8a; color: #ffffff; padding: 28px; margin-bottom: 16px; }
.badge { font-size: 9px; color: #bfdbfe; letter-spacing: 1px; }
.title { font-size: 30px; margin: 6px 0 2px 0; color: #ffffff; }
.sub { font-size: 13px; margin: 0; color: #e0e7ff; }
.sub2 { font-size: 10px; margin: 8px 0 0 0; color: #bfdbfe; }
h2 { font-size: 15px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 3px; margin-top: 16px; margin-bottom: 6px; }
p { margin: 4px 0; }
ul { margin: 4px 0; }
li { margin: 2px 0; }
table { width: 100%; border-collapse: collapse; margin: 6px 0; }
th { background-color: #1e3a8a; color: #ffffff; text-align: left; padding: 4px 6px; font-size: 9.5px; }
td { border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 9.5px; vertical-align: top; }
pre { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; font-size: 8.5px; color: #0f172a; }
.note { background-color: #fef9c3; border-left: 3px solid #eab308; padding: 6px 8px; }
.key { background-color: #dcfce7; border-left: 3px solid #16a34a; padding: 6px 8px; }
"""

out = "/home/user/fitphoneclaude/docs/PortoFlow_Analise.pdf"
story = fitz.Story(html=HTML, user_css=CSS)
MEDIA = fitz.paper_rect("a4")
WHERE = MEDIA + (42, 42, -42, -46)
writer = fitz.DocumentWriter(out)
more = 1
pages = 0
while more:
    dev = writer.begin_page(MEDIA)
    more, _ = story.place(WHERE)
    story.draw(dev)
    writer.end_page()
    pages += 1
writer.close()
print(f"PDF gerado: {out} ({pages} páginas)")
