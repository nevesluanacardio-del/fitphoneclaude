// Gerador de dados da API — agora é uma SIMULAÇÃO M/G/4 ao vivo.
//
// Em vez de osciladores determinísticos, o estado retornado é o SNAPSHOT de uma
// simulação de eventos discretos estocástica (chegadas de Poisson por tipo de
// carga, atendimento exponencial por berço, prioridade não preemptiva e
// compatibilidade de berço). Como a simulação é semeada (determinística dada a
// semente), o estado no instante `now` é obtido reproduzindo os eventos até o
// tempo simulado correspondente — sem precisar manter estado entre requisições
// (ideal para funções serverless). O dashboard passa a ser, de fato, a fila.

import {
  baseBercos,
  type NavioDTO,
  type BercoDTO,
  type IndicadoresDTO,
} from "./baseDados.js";

export interface DadosResponse {
  geradoEm: string;
  navios: NavioDTO[];
  bercos: BercoDTO[];
  indicadores: IndicadoresDTO;
}

type TipoCarga = NavioDTO["tipoCarga"];
type Prioridade = NavioDTO["prioridade"];

const TIPOS: TipoCarga[] = ["Grãos", "Contêineres", "Combustíveis", "Multiuso"];
const SERVICO_H: Record<TipoCarga, number> = { Grãos: 16, Contêineres: 9, Combustíveis: 20, Multiuso: 12 };
const RHO: Record<TipoCarga, number> = { Grãos: 0.74, Contêineres: 0.80, Combustíveis: 0.68, Multiuso: 0.58 };
// Berços compatíveis por tipo. B4 é o berço flexível; Multiuso pode usar também
// B1/B2 quando livres (evita starvation de quem só teria um berço).
const COMPAT: Record<TipoCarga, string[]> = {
  Grãos: ["B1", "B4"], Contêineres: ["B2", "B4"], Combustíveis: ["B3", "B4"], Multiuso: ["B4", "B1", "B2"],
};
const BONUS_PRIO: Record<Prioridade, number> = { Crítica: 30, Alta: 20, Média: 10, Baixa: 0 };
const RANK_PRIO: Record<Prioridade, number> = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };
const DIST_PRIO: [Prioridade, number][] = [["Crítica", 0.1], ["Alta", 0.25], ["Média", 0.4], ["Baixa", 0.25]];
const FAIXA: Record<TipoCarga, { tam: [number, number]; carga: [number, number] }> = {
  Grãos: { tam: [220, 245], carga: [40000, 55000] },
  Contêineres: { tam: [270, 300], carga: [35000, 45000] },
  Combustíveis: { tam: [185, 205], carga: [48000, 60000] },
  Multiuso: { tam: [180, 215], carga: [20000, 30000] },
};
const NAVIO_POOL = [
  "Atlântico Trader", "Container Express VII", "Petro Max", "Marília Cargo", "Cereal Star",
  "Asia Connect II", "Multi Carrier", "Soja Express", "Oil Tanker 5", "Iron Carrier",
  "Pan Ocean", "Bulk Voyager", "Nordic Star", "Santos Dumont", "Amazônia Cargo",
  "Global Mariner", "Itaqui Express", "Maranhão Bulk", "São Marcos", "Tropical Wind",
];

const HORIZONTE_H = 24 * 120; // a simulação repete a cada 120 dias simulados
const HORAS_POR_SEG = 1.2; // velocidade base: 1,2 h simuladas por segundo real
const SEED = 20260601;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const expo = (rand: () => number, taxa: number) => -Math.log(1 - rand()) / taxa;

interface Nav {
  id: number; tipo: TipoCarga; bercos: string[]; prioridade: Prioridade;
  chegada: number; servico: number; tam: number; carga: number;
  inicio?: number; berco?: string;
}

function sortearPrioridade(rand: () => number): Prioridade {
  const u = rand(); let acc = 0;
  for (const [p, w] of DIST_PRIO) { acc += w; if (u <= acc) return p; }
  return "Baixa";
}

// Gera as chegadas (Poisson por tipo) até o tempo `ateH`. Determinístico p/ seed.
function gerarChegadas(ateH: number): Nav[] {
  const rand = rng(SEED);
  const navios: Nav[] = [];
  let id = 0;
  for (const tipo of TIPOS) {
    const mu = 1 / SERVICO_H[tipo];
    const lambda = RHO[tipo] * mu;
    const fx = FAIXA[tipo];
    let t = 0;
    while ((t += expo(rand, lambda)) < ateH) {
      navios.push({
        id: id++, tipo, bercos: COMPAT[tipo],
        prioridade: sortearPrioridade(rand),
        chegada: t, servico: expo(rand, mu),
        tam: Math.round(fx.tam[0] + rand() * (fx.tam[1] - fx.tam[0])),
        carga: Math.round((fx.carga[0] + rand() * (fx.carga[1] - fx.carga[0])) / 100) * 100,
      });
    }
  }
  return navios.sort((a, b) => a.chegada - b.chegada);
}

interface Snapshot {
  bercos: { id: string; nav: Nav; inicio: number; fim: number }[];
  esperando: Nav[];
  WqMedio: number;
  rhoMedio: number;
}

// Reproduz a simulação (política Índice Dinâmico) até `T` e captura o estado.
function snapshot(T: number): Snapshot {
  const chegadas = gerarChegadas(T);
  const BERCOS = ["B1", "B2", "B3", "B4"];
  const ocupado: Record<string, Nav | null> = { B1: null, B2: null, B3: null, B4: null };
  const inicio: Record<string, number> = { B1: 0, B2: 0, B3: 0, B4: 0 };
  const fim: Record<string, number> = { B1: Infinity, B2: Infinity, B3: Infinity, B4: Infinity };
  const ocupadoAcum: Record<string, number> = { B1: 0, B2: 0, B3: 0, B4: 0 };
  const aguardando: Nav[] = [];
  let p = 0, agora = 0, somaEspera = 0, atendidos = 0;

  const livre = (n: Nav) => n.bercos.find((b) => ocupado[b] === null);
  const ida = (n: Nav, t: number) => 40 + 2 * (t - n.chegada) + BONUS_PRIO[n.prioridade];

  const iniciar = (n: Nav) => {
    const b = livre(n)!;
    aguardando.splice(aguardando.indexOf(n), 1);
    ocupado[b] = n; inicio[b] = agora; fim[b] = agora + n.servico;
    n.inicio = agora; n.berco = b;
    somaEspera += agora - n.chegada; atendidos++;
  };
  const despachar = () => {
    for (;;) {
      const aptos = aguardando.filter(livre);
      if (!aptos.length) break;
      aptos.sort((a, b) => RANK_PRIO[a.prioridade] - RANK_PRIO[b.prioridade] || ida(b, agora) - ida(a, agora));
      iniciar(aptos[0]);
    }
  };

  while (p < chegadas.length || BERCOS.some((b) => ocupado[b])) {
    const prox = p < chegadas.length ? chegadas[p].chegada : Infinity;
    let bf = "", tf = Infinity;
    for (const b of BERCOS) if (fim[b] < tf) { tf = fim[b]; bf = b; }
    if (Math.min(prox, tf) > T) break; // não há mais eventos até T

    if (tf <= prox) {
      agora = tf;
      ocupadoAcum[bf] += agora - inicio[bf];
      ocupado[bf] = null; fim[bf] = Infinity;
      despachar();
    } else {
      agora = prox; aguardando.push(chegadas[p]); p++;
      despachar();
    }
  }

  // Contabiliza o tempo de ocupação em curso até T.
  for (const b of BERCOS) if (ocupado[b]) ocupadoAcum[b] += T - inicio[b];

  return {
    bercos: BERCOS.filter((b) => ocupado[b]).map((b) => ({ id: b, nav: ocupado[b]!, inicio: inicio[b], fim: fim[b] })),
    esperando: aguardando.filter((n) => n.chegada <= T),
    WqMedio: atendidos ? somaEspera / atendidos : 0,
    rhoMedio: BERCOS.reduce((s, b) => s + ocupadoAcum[b] / Math.max(T, 1), 0) / BERCOS.length,
  };
}

export function gerarDados(now: number = Date.now(), aceleracao = 1): DadosResponse {
  const T = ((now / 1000) * HORAS_POR_SEG * aceleracao) % HORIZONTE_H;
  const snap = snapshot(T);
  // Nome único por navio (evita colisões que pareceriam o mesmo navio em dois lugares).
  const nomeDe = (n: Nav) => {
    const base = NAVIO_POOL[n.id % NAVIO_POOL.length];
    const volta = Math.floor(n.id / NAVIO_POOL.length);
    return volta === 0 ? base : `${base} ${volta + 1}`;
  };

  // Berços (servidores) com o navio em operação.
  const ocupadosPorId = new Map(snap.bercos.map((o) => [o.id, o]));
  const bercos: BercoDTO[] = baseBercos.map((b) => {
    const o = ocupadosPorId.get(b.id);
    if (!o) return { id: b.id, nome: b.nome, tipo: b.tipo, status: "Livre", capacidadeMaxima: b.capacidadeMaxima, utilizacao: 0 };
    const progresso = clamp((T - o.inicio) / o.nav.servico, 0, 1);
    return {
      id: b.id, nome: b.nome, tipo: b.tipo, status: "Ocupado",
      navioAtual: nomeDe(o.nav),
      tempoOcupacao: round1(T - o.inicio),
      previsaoLiberacao: new Date(now + (o.fim - T) * 3_600_000).toISOString(),
      capacidadeMaxima: b.capacidadeMaxima,
      utilizacao: Math.round(clamp(55 + 40 * progresso, 0, 100)),
    };
  });

  // Fila de espera (clientes) — navios aguardando, ordenados por índice dinâmico.
  const navios: NavioDTO[] = snap.esperando
    .map((n) => {
      const espera = T - n.chegada;
      return {
        id: `N${String(n.id).padStart(4, "0")}`,
        nome: nomeDe(n),
        tipoCarga: n.tipo,
        tempoEspera: round1(espera),
        prioridade: n.prioridade,
        bercoCompativel: n.bercos,
        statusClimatico: "Favorável" as const,
        tamanho: n.tam,
        cargaToneladas: n.carga,
        chegada: new Date(now - espera * 3_600_000).toISOString(),
        indiceDinamico: round1(clamp(40 + 2 * espera + BONUS_PRIO[n.prioridade], 0, 100)),
      };
    })
    .sort((a, b) => b.indiceDinamico - a.indiceDinamico);

  // Utilização = fração de berços ocupados (ρ̂ instantâneo do sistema).
  const ocupadosCount = bercos.filter((b) => b.status === "Ocupado").length;
  const utilizacaoBercos = Math.round((ocupadosCount / baseBercos.length) * 100);
  const esperaMedia = navios.length
    ? navios.reduce((a, n) => a + n.tempoEspera, 0) / navios.length
    : snap.WqMedio;

  const indicadores: IndicadoresDTO = {
    tempoMedioEspera: round1(clamp(esperaMedia, 0, 48)),
    tamanhoFila: navios.length,
    utilizacaoBercos,
    naviosAtrasoCritico: navios.filter((n) => n.prioridade === "Crítica").length,
    riscoClimatico: 30, // sobrescrito pelo clima real em obterDados
    congestionamentoPrevisto: Math.round(clamp(navios.length * 9 + snap.rhoMedio * 30, 0, 100)),
  };

  return { geradoEm: new Date(now).toISOString(), navios, bercos, indicadores };
}

// usado por outros módulos (compatibilidade)
export { baseBercos };
