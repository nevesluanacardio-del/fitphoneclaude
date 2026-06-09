// Camada de acesso a dados: busca os CSVs em /data e converte para os tipos
// usados pela aplicação. É o único ponto que conhece o formato bruto — para
// trocar por uma API REST ou WebSocket no futuro, basta alterar este arquivo.

import { parseCsv } from "./parseCsv";
import type {
  Navio,
  Berco,
  IndicadorOperacional,
} from "./mockData";

export interface DadosOperacionais {
  navios: Navio[];
  bercos: Berco[];
  indicadores: IndicadorOperacional;
}

// Base configurável (Vite injeta BASE_URL conforme o caminho de publicação).
const BASE = import.meta.env.BASE_URL ?? "/";
const url = (file: string) => `${BASE}data/${file}`.replace(/\/{2,}/g, "/");

function num(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(value: string | undefined): Date {
  const d = new Date(value ?? "");
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function fetchCsv(file: string): Promise<Record<string, string>[]> {
  // cache: "no-store" garante que edições no CSV apareçam a cada polling.
  const res = await fetch(url(file), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Falha ao buscar ${file}: HTTP ${res.status}`);
  }
  return parseCsv(await res.text());
}

function mapNavios(rows: Record<string, string>[]): Navio[] {
  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    tipoCarga: r.tipoCarga as Navio["tipoCarga"],
    tempoEspera: num(r.tempoEspera_h),
    prioridade: r.prioridade as Navio["prioridade"],
    bercoCompativel: r.bercoCompativel ? r.bercoCompativel.split(/\s*[;|]\s*/) : [],
    statusClimatico: r.statusClimatico as Navio["statusClimatico"],
    tamanho: num(r.tamanho_m),
    cargaToneladas: num(r.cargaToneladas),
    chegada: parseDate(r.chegada),
    indiceDinamico: num(r.indiceDinamico),
  }));
}

function mapBercos(rows: Record<string, string>[]): Berco[] {
  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    tipo: r.tipo as Berco["tipo"],
    status: r.status as Berco["status"],
    navioAtual: r.navioAtual || undefined,
    tempoOcupacao: r.tempoOcupacao_h ? num(r.tempoOcupacao_h) : undefined,
    previsaoLiberacao: r.previsaoLiberacao ? parseDate(r.previsaoLiberacao) : undefined,
    capacidadeMaxima: num(r.capacidadeMaxima_ton),
    utilizacao: num(r.utilizacao_pct),
  }));
}

function mapIndicadores(rows: Record<string, string>[]): IndicadorOperacional {
  const byKey: Record<string, number> = {};
  rows.forEach((r) => {
    if (r.chave) byKey[r.chave] = num(r.valor);
  });
  return {
    tempoMedioEspera: byKey.tempoMedioEspera ?? 0,
    tamanhoFila: byKey.tamanhoFila ?? 0,
    utilizacaoBercos: byKey.utilizacaoBercos ?? 0,
    naviosAtrasoCritico: byKey.naviosAtrasoCritico ?? 0,
    riscoClimatico: byKey.riscoClimatico ?? 0,
    congestionamentoPrevisto: byKey.congestionamentoPrevisto ?? 0,
  };
}

export async function fetchDadosOperacionais(): Promise<DadosOperacionais> {
  const [navios, bercos, indicadores] = await Promise.all([
    fetchCsv("navios.csv").then(mapNavios),
    fetchCsv("bercos.csv").then(mapBercos),
    fetchCsv("indicadores.csv").then(mapIndicadores),
  ]);
  return { navios, bercos, indicadores };
}
