// Simulação opcional de "operação ao vivo": aplica pequenas variações
// aleatórias (random walk) sobre os dados atuais, mantendo tudo dentro de
// faixas plausíveis. Usada apenas quando o modo simulação está ligado — a
// base continua sendo o que veio dos CSVs.

import type { DadosOperacionais } from "./dataSource";
import type { Berco } from "./mockData";

const NAVIO_POOL = [
  "Soja Express", "Oil Tanker 5", "General Cargo III", "MSC Itaqui",
  "Cereal Star", "Atlântico Trader", "Petro Max", "Asia Connect II",
  "Marília Cargo", "Iron Carrier", "Pan Ocean", "Bulk Voyager",
];

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function escolha<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Transição ocasional de status do berço (atraca/desatraca/manutenção),
// para que a simulação também mexa nos berços — não só na ocupação.
function transicaoBerco(b: Berco): Berco {
  const r = Math.random();
  if (b.status === "Ocupado") {
    if (r < 0.12) {
      // desatraca → livre
      return {
        id: b.id, nome: b.nome, tipo: b.tipo,
        capacidadeMaxima: b.capacidadeMaxima, status: "Livre", utilizacao: 0,
      };
    }
    // segue ocupado, avançando ocupação
    return {
      ...b,
      utilizacao: Math.round(clamp(b.utilizacao + drift(4), 30, 100)),
      tempoOcupacao: round1(clamp((b.tempoOcupacao ?? 0) + 0.4, 0, 72)),
    };
  }
  if (b.status === "Livre") {
    if (r < 0.18) {
      // atraca um novo navio
      return {
        ...b,
        status: "Ocupado",
        navioAtual: escolha(NAVIO_POOL),
        tempoOcupacao: round1(0.5 + Math.random() * 2),
        previsaoLiberacao: new Date(Date.now() + (4 + Math.random() * 12) * 3_600_000),
        utilizacao: Math.round(45 + Math.random() * 30),
      };
    }
    if (r > 0.97) return { ...b, status: "Manutenção", utilizacao: 0 };
    return b;
  }
  // Manutenção → volta a ficar livre eventualmente
  if (r < 0.15) return { ...b, status: "Livre" };
  return b;
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

  const bercos = prev.bercos.map(transicaoBerco);

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
