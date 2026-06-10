// Simulação opcional de "operação ao vivo": aplica variações sobre os dados
// atuais (random walk) e movimenta os berços — navios atracam e desatracam.
// Os navios que atracam são alocados da fila respeitando a prioridade.

import type { DadosOperacionais } from "./dataSource";
import type { Berco } from "./mockData";
import { alocarNavios } from "../../../api/_lib/alocacao.js";

// Navio genérico, usado só quando não há navio compatível na fila.
const NAVIO_POOL = [
  "Soja Express", "Oil Tanker 5", "General Cargo III", "MSC Itaqui",
  "Cereal Star", "Atlântico Trader", "Petro Max", "Asia Connect II",
  "Marília Cargo", "Iron Carrier", "Pan Ocean", "Bulk Voyager",
];

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

function escolha<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function bercoLivre(b: Berco, status: Berco["status"] = "Livre"): Berco {
  return {
    id: b.id, nome: b.nome, tipo: b.tipo,
    capacidadeMaxima: b.capacidadeMaxima, status, utilizacao: 0,
  };
}

export function simulateStep(prev: DadosOperacionais): DadosOperacionais {
  const navios = prev.navios.map((n) => ({
    ...n,
    tempoEspera: round1(clamp(n.tempoEspera + drift(0.3), 0, 48)),
    indiceDinamico: round1(clamp((n.indiceDinamico ?? 0) + drift(1.5), 0, 100)),
  }));

  // 1) Decide o novo status de cada berço (atraca/desatraca/manutenção).
  type Plano = { b: Berco; status: Berco["status"]; mantemNavio: boolean };
  const planos: Plano[] = prev.bercos.map((b) => {
    const r = Math.random();
    if (b.status === "Ocupado") {
      if (r < 0.12) return { b, status: "Livre", mantemNavio: false }; // desatraca
      return { b, status: "Ocupado", mantemNavio: true }; // segue ocupado
    }
    if (b.status === "Livre") {
      if (r < 0.2) return { b, status: "Ocupado", mantemNavio: false }; // atraca
      if (r > 0.985) return { b, status: "Manutenção", mantemNavio: false };
      return { b, status: "Livre", mantemNavio: false };
    }
    // Manutenção → eventualmente volta a ficar livre
    if (r < 0.15) return { b, status: "Livre", mantemNavio: false };
    return { b, status: "Manutenção", mantemNavio: false };
  });

  // 2) Navios que continuam atracados (não podem ser realocados).
  const atracados = new Set<string>();
  planos.forEach((p) => {
    if (p.status === "Ocupado" && p.mantemNavio && p.b.navioAtual) {
      atracados.add(p.b.navioAtual);
    }
  });

  // 3) Aloca navios da fila aos berços que acabaram de ocupar, por prioridade.
  const novos = planos
    .filter((p) => p.status === "Ocupado" && !p.mantemNavio)
    .map((p) => p.b.id);
  const disponiveis = navios.filter((n) => !atracados.has(n.nome));
  const alocacao = alocarNavios(disponiveis, novos);

  // 4) Monta os berços.
  const bercos: Berco[] = planos.map((p) => {
    if (p.status === "Manutenção") return bercoLivre(p.b, "Manutenção");
    if (p.status === "Livre") return bercoLivre(p.b, "Livre");
    if (p.mantemNavio) {
      // segue ocupado: avança ocupação
      return {
        ...p.b,
        utilizacao: Math.round(clamp(p.b.utilizacao + drift(4), 30, 100)),
        tempoOcupacao: round1(clamp((p.b.tempoOcupacao ?? 0) + 0.4, 0, 72)),
      };
    }
    // atracação nova: navio de maior prioridade compatível (ou genérico)
    const navio = alocacao.get(p.b.id);
    return {
      id: p.b.id, nome: p.b.nome, tipo: p.b.tipo,
      capacidadeMaxima: p.b.capacidadeMaxima,
      status: "Ocupado",
      navioAtual: navio?.nome ?? escolha(NAVIO_POOL),
      tempoOcupacao: round1(0.5 + Math.random() * 2),
      previsaoLiberacao: new Date(Date.now() + (4 + Math.random() * 12) * 3_600_000),
      utilizacao: Math.round(45 + Math.random() * 30),
    };
  });

  // Utilização média dos berços mantém o KPI coerente com a página Berços.
  const ativos = bercos.filter((b) => b.status !== "Manutenção");
  const utilizacaoBercos = ativos.length
    ? Math.round(ativos.reduce((a, b) => a + b.utilizacao, 0) / ativos.length)
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
