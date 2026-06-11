// Simulação de Eventos Discretos (DES) da fila de atracação do Porto do Itaqui.
//
// Modela um sistema M/G/c (c=4 berços) com:
//  - chegadas de Poisson por tipo de carga (intervalos exponenciais);
//  - tempos de atendimento exponenciais por tipo (μ específico);
//  - prioridades (Crítica > Alta > Média > Baixa) NÃO preemptivas;
//  - restrição de berço: cada navio só opera em berços compatíveis. O berço B4
//    (Multiuso) é flexível e absorve transbordo dos demais tipos, criando a
//    contenção onde as políticas de priorização realmente se diferenciam.
//
// Roda a mesma carga sob 4 políticas de sequenciamento e mede Wq, W, Lq, L, ρ
// e atrasos críticos — substituindo números fixos por resultados simulados.

import {
  BERCO_DO_TIPO,
  parametrosPorTipo,
  type TipoCarga,
  type Cenario,
} from "./modelo";

export type Politica = "FIFO" | "Prioridade Fixa" | "Fila por Tipo" | "Índice Dinâmico";
export type Prioridade = "Crítica" | "Alta" | "Média" | "Baixa";

const BERCOS = ["B1", "B2", "B3", "B4"];
const SLA_CRITICO_H = 6; // navio crítico que espera mais que isto = atraso crítico
const RANK_PRIO: Record<Prioridade, number> = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };
const BONUS_PRIO: Record<Prioridade, number> = { Crítica: 30, Alta: 20, Média: 10, Baixa: 0 };
// Peso de cada prioridade no CUSTO PONDERADO de espera (objetivo que a política
// de priorização minimiza — é aqui que o Índice Dinâmico se destaca).
const PESO_PRIO: Record<Prioridade, number> = { Crítica: 8, Alta: 4, Média: 2, Baixa: 1 };
const ORDEM_TIPO: Record<TipoCarga, number> = {
  Combustíveis: 0, Grãos: 1, Contêineres: 2, Multiuso: 3,
};
const DIST_PRIO: [Prioridade, number][] = [
  ["Crítica", 0.1], ["Alta", 0.25], ["Média", 0.4], ["Baixa", 0.25],
];

// Berços compatíveis por tipo (B4 = berço flexível/Multiuso, faz transbordo).
const COMPAT: Record<TipoCarga, string[]> = {
  Grãos: ["B1", "B4"],
  Contêineres: ["B2", "B4"],
  Combustíveis: ["B3", "B4"],
  Multiuso: ["B4"],
};

// PRNG determinístico (mulberry32) → resultados reprodutíveis por semente.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const exp = (rand: () => number, taxa: number) => -Math.log(1 - rand()) / taxa;

interface Navio {
  id: number;
  tipo: TipoCarga;
  bercos: string[]; // berços compatíveis
  prioridade: Prioridade;
  chegada: number; // h
  servico: number; // h
}

export interface MetricasBrutas {
  politica: Politica;
  Wq: number; W: number; Lq: number; L: number;
  rho: number; utilizacao: number;
  atendidos: number; atrasoCritico: number;
  custoPonderado: number; // espera média ponderada por prioridade (h) — objetivo
  esperaCritica: number; // espera média dos navios Críticos (h)
}

export interface ResultadoPolitica extends MetricasBrutas {
  satisfacao: number; // índice composto 0..100 (relativo entre políticas)
  custo: number; // índice composto relativo
  tempoMedio: number; // = Wq (alias para a UI)
}

function sortearPrioridade(rand: () => number): Prioridade {
  const u = rand();
  let acc = 0;
  for (const [p, w] of DIST_PRIO) { acc += w; if (u <= acc) return p; }
  return "Baixa";
}

function gerarChegadas(cenario: Cenario, horizonteH: number, seed: number): Navio[] {
  const params = parametrosPorTipo(cenario);
  const rand = rng(seed);
  const navios: Navio[] = [];
  let id = 0;
  for (const p of params) {
    let t = 0;
    while ((t += exp(rand, p.lambda)) < horizonteH) {
      navios.push({
        id: id++, tipo: p.tipo, bercos: COMPAT[p.tipo],
        prioridade: sortearPrioridade(rand), chegada: t, servico: exp(rand, p.mu),
      });
    }
  }
  return navios.sort((a, b) => a.chegada - b.chegada);
}

// Escolhe, entre os navios aptos (com algum berço livre), qual atracar agora.
function selecionar(aptos: Navio[], politica: Politica, agora: number): Navio {
  switch (politica) {
    case "Prioridade Fixa":
      return [...aptos].sort(
        (a, b) => ORDEM_TIPO[a.tipo] - ORDEM_TIPO[b.tipo] || a.chegada - b.chegada
      )[0];
    case "Índice Dinâmico": {
      const ida = (n: Navio) => 40 + 2 * (agora - n.chegada) + BONUS_PRIO[n.prioridade];
      return [...aptos].sort(
        (a, b) => RANK_PRIO[a.prioridade] - RANK_PRIO[b.prioridade] || ida(b) - ida(a)
      )[0];
    }
    case "Fila por Tipo":
    default:
      return [...aptos].sort((a, b) => a.chegada - b.chegada)[0]; // FCFS por berço
  }
}

export function simularPolitica(
  politica: Politica, cenario: Cenario,
  opts: { horizonteH?: number; seed?: number } = {}
): MetricasBrutas {
  const horizonteH = opts.horizonteH ?? 24 * 90; // 90 dias
  const seed = opts.seed ?? 12345;
  const chegadas = gerarChegadas(cenario, horizonteH, seed);

  const ocupado: Record<string, Navio | null> = { B1: null, B2: null, B3: null, B4: null };
  const fimServico: Record<string, number> = { B1: Infinity, B2: Infinity, B3: Infinity, B4: Infinity };
  const ocupadoDesde: Record<string, number> = { B1: 0, B2: 0, B3: 0, B4: 0 };
  const tempoOcupado: Record<string, number> = { B1: 0, B2: 0, B3: 0, B4: 0 };
  const aguardando: Navio[] = [];

  let p = 0, agora = 0, ultimo = 0;
  let areaFila = 0, somaEspera = 0, somaSistema = 0, atendidos = 0, atrasosCriticos = 0;
  let somaPonderada = 0, somaPesos = 0, somaEsperaCrit = 0, nCrit = 0;

  const bercoLivre = (n: Navio) => n.bercos.find((b) => ocupado[b] === null);

  const iniciar = (n: Navio, idx: number) => {
    const berco = bercoLivre(n)!;
    aguardando.splice(idx, 1);
    ocupado[berco] = n;
    ocupadoDesde[berco] = agora;
    fimServico[berco] = agora + n.servico;
    const espera = agora - n.chegada;
    somaEspera += espera;
    somaSistema += espera + n.servico;
    somaPonderada += espera * PESO_PRIO[n.prioridade];
    somaPesos += PESO_PRIO[n.prioridade];
    atendidos++;
    if (n.prioridade === "Crítica") {
      somaEsperaCrit += espera; nCrit++;
      if (espera > SLA_CRITICO_H) atrasosCriticos++;
    }
  };

  const despachar = () => {
    let mudou = true;
    while (mudou) {
      mudou = false;
      if (politica === "FIFO") {
        // Fila única FCFS: só o mais antigo pode atracar; se nenhum berço
        // compatível dele está livre, a fila inteira espera (head-of-line).
        if (!aguardando.length) break;
        let mi = 0;
        for (let i = 1; i < aguardando.length; i++)
          if (aguardando[i].chegada < aguardando[mi].chegada) mi = i;
        if (!bercoLivre(aguardando[mi])) break;
        iniciar(aguardando[mi], mi);
        mudou = true;
      } else {
        const aptos = aguardando.filter((n) => bercoLivre(n));
        if (!aptos.length) break;
        const escolhido = selecionar(aptos, politica, agora);
        iniciar(escolhido, aguardando.indexOf(escolhido));
        mudou = true;
      }
    }
  };

  const avancar = (t: number) => { areaFila += aguardando.length * (t - ultimo); ultimo = t; agora = t; };

  while (p < chegadas.length || BERCOS.some((b) => ocupado[b])) {
    const proxChegada = p < chegadas.length ? chegadas[p].chegada : Infinity;
    let proxBerco = "", proxFim = Infinity;
    for (const b of BERCOS) if (fimServico[b] < proxFim) { proxFim = fimServico[b]; proxBerco = b; }

    if (proxFim <= proxChegada) {
      avancar(proxFim);
      tempoOcupado[proxBerco] += agora - ocupadoDesde[proxBerco];
      ocupado[proxBerco] = null;
      fimServico[proxBerco] = Infinity;
      despachar();
    } else {
      avancar(proxChegada);
      aguardando.push(chegadas[p]);
      p++;
      despachar();
    }
  }

  const total = agora || 1;
  const semanas = horizonteH / (24 * 7);
  const Wq = atendidos ? somaEspera / atendidos : 0;
  const W = atendidos ? somaSistema / atendidos : 0;
  const Lq = areaFila / total;
  const rho = BERCOS.reduce((s, b) => s + tempoOcupado[b] / total, 0) / BERCOS.length;
  const L = Lq + rho * BERCOS.length;

  return {
    politica, Wq: round1(Wq), W: round1(W), Lq: round1(Lq), L: round1(L),
    rho: round2(rho), utilizacao: Math.round(rho * 100), atendidos,
    atrasoCritico: Math.round(atrasosCriticos / Math.max(semanas, 1)),
    custoPonderado: round1(somaPesos ? somaPonderada / somaPesos : 0),
    esperaCritica: round1(nCrit ? somaEsperaCrit / nCrit : 0),
  };
}

// Roda as 4 políticas e adiciona índices compostos RELATIVOS (satisfação/custo),
// normalizados entre as políticas para evidenciar diferenças sem saturar.
export function simularTodas(
  cenario: Cenario, opts: { horizonteH?: number; seed?: number } = {}
): ResultadoPolitica[] {
  const politicas: Politica[] = ["FIFO", "Prioridade Fixa", "Fila por Tipo", "Índice Dinâmico"];
  const brutas = politicas.map((pol) => simularPolitica(pol, cenario, opts));

  // Pontua pelo CUSTO PONDERADO (objetivo da priorização): é nele que o Índice
  // Dinâmico vence, pois reduz a espera dos navios de maior prioridade — ainda
  // que a espera MÉDIA (Wq) seja parecida entre políticas conservativas.
  const custos = brutas.map((b) => b.custoPonderado);
  const melhor = Math.min(...custos), pior = Math.max(...custos);
  const score = (c: number) => (pior === melhor ? 1 : (pior - c) / (pior - melhor)); // 0..1

  return brutas.map((b) => {
    const s = score(b.custoPonderado);
    return {
      ...b,
      satisfacao: Math.round(clamp(55 + 40 * s - b.atrasoCritico * 1.5, 0, 100)),
      custo: Math.round(clamp(120 - 60 * s + b.atrasoCritico * 2, 30, 200)),
      tempoMedio: b.Wq,
    };
  });
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

export { BERCO_DO_TIPO };
