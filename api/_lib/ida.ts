// Índice Dinâmico de Atracação (IDA) — função de priorização MULTICRITÉRIO,
// conforme o board CO-LAB e os slides da equipe. Combina os fatores operacionais
// relevantes em uma única pontuação (0–100): quanto maior, maior a prioridade.
//
// Fatores (board):
//   • prioridade legal/estratégica/contratual  → nível de prioridade do navio
//   • tempo de espera acumulado
//   • tipo de carga (peso estratégico)
//   • impacto logístico do atraso (porte/carga)
//   • compatibilidade de berço (restrição)
//   • risco climático

import type { NavioDTO } from "./baseDados.js";

type Prioridade = NavioDTO["prioridade"];
type TipoCarga = NavioDTO["tipoCarga"];
type StatusClima = NavioDTO["statusClimatico"];

// Pesos por fator (somam, no máximo, ~100).
const PESO_PRIORIDADE: Record<Prioridade, number> = { Crítica: 40, Alta: 28, Média: 16, Baixa: 8 };
const PESO_CARGA: Record<TipoCarga, number> = { Combustíveis: 12, Grãos: 10, Contêineres: 8, Multiuso: 5 };
const PESO_CLIMA: Record<StatusClima, number> = { Favorável: 12, Atenção: 6, Desfavorável: 0 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export interface FatoresIDA {
  prioridade: number;
  espera: number;
  carga: number;
  logistico: number;
  compatibilidade: number;
  clima: number;
}

// Decompõe o IDA em fatores (útil para a tela de Recomendação/justificativa).
export function fatoresIDA(n: {
  prioridade: Prioridade;
  tempoEspera: number;
  tipoCarga: TipoCarga;
  cargaToneladas: number;
  bercoCompativel: string[];
  statusClimatico?: StatusClima;
}): FatoresIDA {
  return {
    prioridade: PESO_PRIORIDADE[n.prioridade],
    // Espera: até 20 pontos, saturando em 12h de espera.
    espera: clamp((n.tempoEspera / 12) * 20, 0, 20),
    carga: PESO_CARGA[n.tipoCarga],
    // Impacto logístico: até 10 pontos pela carga (toneladas).
    logistico: clamp((n.cargaToneladas / 60000) * 10, 0, 10),
    // Compatibilidade: navio restrito a um único berço é mais difícil de
    // alocar → recebe leve reforço para não ficar preso na fila.
    compatibilidade: n.bercoCompativel.length <= 1 ? 6 : 3,
    clima: PESO_CLIMA[n.statusClimatico ?? "Favorável"],
  };
}

// Pontuação final do IDA (0–100).
export function calcularIDA(n: Parameters<typeof fatoresIDA>[0]): number {
  const f = fatoresIDA(n);
  const total = f.prioridade + f.espera + f.carga + f.logistico + f.compatibilidade + f.clima;
  return round1(clamp(total, 0, 100));
}
