// Modelo matemático de filas do Porto do Itaqui.
//
// O sistema é modelado como uma fila MULTI-SERVIDOR com servidores especializados:
// 4 berços, cada um dedicado a um tipo de carga. Como cada navio só opera no
// berço do seu tipo, o sistema se decompõe em 4 filas M/M/1 paralelas (uma por
// tipo) e também pode ser analisado de forma agregada como M/M/c (c=4, Erlang-C).
//
// Aqui ficam: os parâmetros (λ, μ por tipo, cenários) e as fórmulas analíticas
// clássicas de Teoria das Filas usadas como referência na tela "Modelo de Fila".

export type TipoCarga = "Grãos" | "Contêineres" | "Combustíveis" | "Multiuso";
export type Cenario = "normal" | "pico";

// Tempo médio de operação (atendimento) por tipo de carga, em horas → define μ.
export const SERVICO_H: Record<TipoCarga, number> = {
  Grãos: 16,
  Contêineres: 9,
  Combustíveis: 20,
  Multiuso: 12,
};

// Berço dedicado a cada tipo de carga (servidores especializados).
export const BERCO_DO_TIPO: Record<TipoCarga, string> = {
  Grãos: "B1",
  Contêineres: "B2",
  Combustíveis: "B3",
  Multiuso: "B4",
};

// Intensidade de tráfego alvo (ρ = λ/μ) por cenário e tipo. Define λ = ρ·μ,
// mantendo o sistema estável (ρ < 1) mas congestionado no pico.
const RHO_ALVO: Record<Cenario, Record<TipoCarga, number>> = {
  normal: { Grãos: 0.58, Contêineres: 0.66, Combustíveis: 0.52, Multiuso: 0.48 },
  pico: { Grãos: 0.66, Contêineres: 0.74, Combustíveis: 0.60, Multiuso: 0.54 },
};

export interface ParametrosTipo {
  tipo: TipoCarga;
  berco: string;
  servicoH: number; // tempo médio de atendimento (h)
  mu: number; // taxa de atendimento (navios/h)
  lambda: number; // taxa de chegada (navios/h)
  rho: number; // utilização do berço (λ/μ)
  // Métricas analíticas M/M/1 (fila por tipo):
  Wq: number; // espera média na fila (h)
  W: number; // tempo médio no sistema (h)
  Lq: number; // nº médio na fila
  L: number; // nº médio no sistema
}

const TIPOS: TipoCarga[] = ["Grãos", "Contêineres", "Combustíveis", "Multiuso"];

// Métricas M/M/1 por tipo (cada berço é um servidor único do seu tipo).
export function parametrosPorTipo(cenario: Cenario): ParametrosTipo[] {
  return TIPOS.map((tipo) => {
    const servicoH = SERVICO_H[tipo];
    const mu = 1 / servicoH;
    const rho = RHO_ALVO[cenario][tipo];
    const lambda = rho * mu;
    // M/M/1: Lq = ρ²/(1-ρ), Wq = Lq/λ, W = Wq + 1/μ, L = Lq + ρ
    const Lq = (rho * rho) / (1 - rho);
    const Wq = Lq / lambda;
    const W = Wq + 1 / mu;
    const L = Lq + rho;
    return { tipo, berco: BERCO_DO_TIPO[tipo], servicoH, mu, lambda, rho, Wq, W, Lq, L };
  });
}

function fatorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

export interface MetricasErlangC {
  c: number;
  lambdaTotal: number; // chegadas/h somando os tipos
  muMedio: number; // taxa de atendimento média (navios/h)
  r: number; // carga oferecida = λ/μ (em "servidores ocupados")
  rho: number; // utilização do sistema = r/c
  P0: number; // prob. sistema vazio
  Pwait: number; // prob. de esperar (fórmula de Erlang-C)
  Wq: number; // espera média na fila (h)
  W: number;
  Lq: number;
  L: number;
}

// Visão agregada M/M/c (c=4) via fórmula de Erlang-C. Trata os 4 berços como
// um pool com chegada total e atendimento médio ponderado pela demanda.
export function metricasErlangC(cenario: Cenario): MetricasErlangC {
  const params = parametrosPorTipo(cenario);
  const c = params.length; // 4
  const lambdaTotal = params.reduce((s, p) => s + p.lambda, 0);
  // μ médio ponderado pela fração de chegadas de cada tipo.
  const muMedio =
    lambdaTotal /
    params.reduce((s, p) => s + p.lambda / p.mu, 0); // = 1 / E[tempo de serviço]
  const r = lambdaTotal / muMedio; // carga oferecida
  const rho = r / c;

  let soma = 0;
  for (let n = 0; n < c; n++) soma += Math.pow(r, n) / fatorial(n);
  const termoC = Math.pow(r, c) / (fatorial(c) * (1 - rho));
  const P0 = 1 / (soma + termoC);
  const Pwait = termoC * P0;

  const Wq = Pwait / (c * muMedio - lambdaTotal);
  const W = Wq + 1 / muMedio;
  const Lq = lambdaTotal * Wq;
  const L = lambdaTotal * W;

  return { c, lambdaTotal, muMedio, r, rho, P0, Pwait, Wq, W, Lq, L };
}
