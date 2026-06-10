// Alocação de navios da fila para os berços, respeitando a prioridade.
// Para cada berço a ser ocupado, escolhe entre os navios da fila COMPATÍVEIS
// com aquele berço o de maior prioridade (Crítica > Alta > Média > Baixa) e,
// no desempate, o de maior índice dinâmico. Cada navio é alocado a no máximo
// um berço. Módulo puro, compartilhado entre o gerador (API) e a simulação.

export interface NavioAlocavel {
  id?: string;
  nome: string;
  prioridade: "Crítica" | "Alta" | "Média" | "Baixa";
  bercoCompativel: string[];
  indiceDinamico?: number;
}

const RANK: Record<NavioAlocavel["prioridade"], number> = {
  Crítica: 0,
  Alta: 1,
  Média: 2,
  Baixa: 3,
};

function chave(n: NavioAlocavel): string {
  return n.id ?? n.nome;
}

// Retorna um mapa bercoId -> navio alocado. `bercoIds` são os berços que devem
// ficar ocupados neste instante. Berços sem navio compatível ficam de fora do
// mapa (o chamador decide o fallback).
export function alocarNavios<N extends NavioAlocavel>(
  navios: N[],
  bercoIds: string[]
): Map<string, N> {
  const usados = new Set<string>();
  const mapa = new Map<string, N>();

  // Ordena os berços pela "melhor" prioridade disponível, para que o navio
  // mais crítico seja alocado primeiro mesmo quando concorre por poucos berços.
  const ordenados = [...bercoIds].sort((a, b) => {
    const melhor = (bid: string) =>
      Math.min(
        ...navios
          .filter((n) => n.bercoCompativel.includes(bid))
          .map((n) => RANK[n.prioridade]),
        99
      );
    return melhor(a) - melhor(b);
  });

  for (const bid of ordenados) {
    const candidato = navios
      .filter((n) => !usados.has(chave(n)) && n.bercoCompativel.includes(bid))
      .sort(
        (a, b) =>
          RANK[a.prioridade] - RANK[b.prioridade] ||
          (b.indiceDinamico ?? 0) - (a.indiceDinamico ?? 0)
      )[0];

    if (candidato) {
      mapa.set(bid, candidato);
      usados.add(chave(candidato));
    }
  }

  return mapa;
}
