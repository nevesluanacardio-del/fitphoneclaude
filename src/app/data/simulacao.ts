// Simulação opcional de "operação ao vivo": aplica pequenas variações
// aleatórias (random walk) sobre os dados atuais, mantendo tudo dentro de
// faixas plausíveis. Usada apenas quando o modo simulação está ligado — a
// base continua sendo o que veio dos CSVs.

import type { DadosOperacionais } from "./dataSource";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// Variação contínua: passo aleatório entre -amp e +amp.
function drift(amp: number): number {
  return (Math.random() * 2 - 1) * amp;
}

// Variação ocasional de inteiros (ex.: ±1 de vez em quando).
function tick(prob: number): number {
  if (Math.random() > prob) return 0;
  return Math.random() < 0.5 ? -1 : 1;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export function simulateStep(prev: DadosOperacionais): DadosOperacionais {
  const navios = prev.navios.map((n) => ({
    ...n,
    tempoEspera: round1(clamp(n.tempoEspera + drift(0.3), 0, 48)),
    indiceDinamico: round1(
      clamp((n.indiceDinamico ?? 0) + drift(1.5), 0, 100)
    ),
  }));

  const bercos = prev.bercos.map((b) =>
    b.status === "Ocupado"
      ? {
          ...b,
          utilizacao: Math.round(clamp(b.utilizacao + drift(3), 0, 100)),
          tempoOcupacao:
            b.tempoOcupacao !== undefined
              ? round1(clamp(b.tempoOcupacao + 0.05, 0, 72))
              : b.tempoOcupacao,
        }
      : b
  );

  // Utilização média dos berços mantém o KPI coerente com a página Berços.
  const ocupados = bercos.filter((b) => b.status !== "Manutenção");
  const utilizacaoBercos = ocupados.length
    ? Math.round(ocupados.reduce((a, b) => a + b.utilizacao, 0) / ocupados.length)
    : prev.indicadores.utilizacaoBercos;

  const ind = prev.indicadores;
  const indicadores = {
    tempoMedioEspera: round1(clamp(ind.tempoMedioEspera + drift(0.4), 1, 24)),
    tamanhoFila: clamp(ind.tamanhoFila + tick(0.25), 0, 20),
    utilizacaoBercos,
    naviosAtrasoCritico: clamp(ind.naviosAtrasoCritico + tick(0.15), 0, 10),
    riscoClimatico: Math.round(clamp(ind.riscoClimatico + drift(4), 0, 100)),
    congestionamentoPrevisto: Math.round(
      clamp(ind.congestionamentoPrevisto + drift(4), 0, 100)
    ),
  };

  return { navios, bercos, indicadores };
}
