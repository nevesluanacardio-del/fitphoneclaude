// Atracação dinâmica dos navios AIS nos berços.
//
// Como o coletor AIS é um processo de pé, ele mantém o estado dos berços: os
// navios da fila do AIS são alocados aos berços por prioridade/IDA, ocupam por um
// tempo de operação (por tipo de carga) e liberam — tornando a fila dinâmica.

import { baseBercos, type NavioDTO, type BercoDTO } from "../api/_lib/baseDados";

const BERCOS = ["B1", "B2", "B3", "B4"];
const SERVICO_H: Record<NavioDTO["tipoCarga"], number> = {
  Grãos: 18, Contêineres: 12, Combustíveis: 10, Multiuso: 8,
};
const SEG_POR_HORA = 2.5; // 1h de operação ≈ 2,5s reais (cicla os berços na demo)
const COOLDOWN_FATOR = 6; // após operar, o navio "descansa" antes de poder reatracar

const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

interface Atracacao {
  id: string; nome: string; tipo: NavioDTO["tipoCarga"];
  inicioMs: number; duracaoMs: number; duracaoH: number;
}
const atracados: Record<string, Atracacao | null> = { B1: null, B2: null, B3: null, B4: null };
// Navios que acabaram de operar e estão em "descanso" (não reatracam até `ate`).
const descansoAte = new Map<string, number>();

export interface ReconcilioResultado {
  bercos: BercoDTO[];
  fila: NavioDTO[];
  ocupados: number;
}

// Aloca/atualiza os berços a partir da fila AIS atual (já ordenada por IDA) e
// devolve os berços, a fila restante e quantos berços estão ocupados.
export function reconciliarBercos(
  navios: NavioDTO[],
  nowMs: number,
  aceleracao: number,
  interrompe: boolean
): ReconcilioResultado {
  const presentes = new Set(navios.map((n) => n.id));

  // Libera berço quando o serviço termina OU o navio saiu da área monitorada.
  // Quem TERMINOU de operar entra em descanso (não reatraca já em seguida),
  // permitindo que a fila gire; quem apenas saiu da área não descansa.
  for (const b of BERCOS) {
    const a = atracados[b];
    if (!a) continue;
    const terminou = nowMs >= a.inicioMs + a.duracaoMs;
    const saiu = !presentes.has(a.id);
    if (terminou || saiu) {
      if (terminou && !saiu) descansoAte.set(a.id, nowMs + a.duracaoMs * COOLDOWN_FATOR);
      atracados[b] = null;
    }
  }
  // Limpa o descanso de navios que já podem reatracar ou que saíram da área.
  for (const [id, ate] of descansoAte) if (nowMs >= ate || !presentes.has(id)) descansoAte.delete(id);

  const ocupadosIds = new Set(
    Object.values(atracados).filter(Boolean).map((a) => (a as Atracacao).id)
  );
  const espera = navios.filter((n) => !ocupadosIds.has(n.id));

  // Para cada berço livre, atraca o melhor navio compatível disponível que não
  // esteja em descanso.
  for (const b of BERCOS) {
    if (atracados[b]) continue;
    const cand = espera.find(
      (n) => n.bercoCompativel.includes(b) && !ocupadosIds.has(n.id) && !descansoAte.has(n.id)
    );
    if (!cand) continue;
    const meanH = SERVICO_H[cand.tipoCarga];
    atracados[b] = {
      id: cand.id, nome: cand.nome, tipo: cand.tipoCarga,
      inicioMs: nowMs,
      duracaoMs: (meanH * SEG_POR_HORA * 1000) / Math.max(aceleracao, 1),
      duracaoH: meanH,
    };
    ocupadosIds.add(cand.id);
  }

  const bercos: BercoDTO[] = baseBercos.map((bb) => {
    const a = atracados[bb.id];
    if (!a) {
      return { id: bb.id, nome: bb.nome, tipo: bb.tipo, status: "Livre", capacidadeMaxima: bb.capacidadeMaxima, utilizacao: 0 };
    }
    const prog = clampN((nowMs - a.inicioMs) / a.duracaoMs, 0, 1);
    return {
      id: bb.id, nome: bb.nome, tipo: bb.tipo, status: "Ocupado",
      navioAtual: a.nome,
      tempoOcupacao: r1(prog * a.duracaoH),
      previsaoLiberacao: new Date(nowMs + (1 - prog) * a.duracaoH * 3_600_000).toISOString(),
      capacidadeMaxima: bb.capacidadeMaxima,
      utilizacao: Math.round(clampN(55 + 40 * prog, 0, 100)),
      operacaoInterrompida: interrompe,
    };
  });

  const fila = navios.filter((n) => !ocupadosIds.has(n.id));
  return { bercos, fila, ocupados: bercos.filter((b) => b.status === "Ocupado").length };
}
