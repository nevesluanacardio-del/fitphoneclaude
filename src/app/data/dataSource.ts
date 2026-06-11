// Camada de acesso a dados: consome a API (/api/dados) e converte o JSON para
// os tipos usados pela aplicação. É o único ponto que conhece o formato da API —
// para trocar por outro backend basta alterar este arquivo (e VITE_API_URL).

import type { Navio, Berco, IndicadorOperacional } from "./mockData";

export type FonteNavios = "simulado" | "ais" | "ais-aguardando";

export interface DadosOperacionais {
  navios: Navio[];
  bercos: Berco[];
  indicadores: IndicadorOperacional;
  /** Origem da fila de navios: simulação, AIS real ou AIS aguardando. */
  fonte: FonteNavios;
  /** Clima real (Open-Meteo) disponível neste momento? */
  climaReal: boolean;
}

// Endpoint da API. Por padrão usa a rota servida pelo próprio projeto
// (Vite em dev/preview, Vercel/Netlify em produção). Pode apontar para um
// backend externo via VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || "/api/dados";

function parseDate(value: string | undefined): Date {
  const d = new Date(value ?? "");
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

interface NavioJson extends Omit<Navio, "chegada" | "previsaoAtracacao"> {
  chegada: string;
  previsaoAtracacao?: string;
}

interface BercoJson extends Omit<Berco, "previsaoLiberacao"> {
  previsaoLiberacao?: string;
}

interface DadosJson {
  navios: NavioJson[];
  bercos: BercoJson[];
  indicadores: IndicadorOperacional;
  fonte?: FonteNavios; // só o coletor AIS define; ausente = simulado
  clima?: { detalhe?: { fonte?: string } };
}

export async function fetchDadosOperacionais(
  aceleracao = 1
): Promise<DadosOperacionais> {
  // cache: "no-store" garante valores atuais a cada polling.
  const sep = API_URL.includes("?") ? "&" : "?";
  const url = aceleracao > 1 ? `${API_URL}${sep}aceleracao=${aceleracao}` : API_URL;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Falha ao buscar dados: HTTP ${res.status}`);
  }
  const json = (await res.json()) as DadosJson;

  return {
    navios: json.navios.map((n) => ({
      ...n,
      chegada: parseDate(n.chegada),
      previsaoAtracacao: n.previsaoAtracacao ? parseDate(n.previsaoAtracacao) : undefined,
    })),
    bercos: json.bercos.map((b) => ({
      ...b,
      previsaoLiberacao: b.previsaoLiberacao ? parseDate(b.previsaoLiberacao) : undefined,
    })),
    indicadores: json.indicadores,
    fonte: json.fonte ?? "simulado",
    climaReal: json.clima?.detalhe?.fonte === "open-meteo",
  };
}
