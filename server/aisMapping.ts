// Mapeamento de mensagens AIS (aisstream.io) para o schema de Navio da aplicação.
//
// IMPORTANTE: o AIS transmite identificação, posição, rumo, velocidade e alguns
// dados estáticos (nome, tipo, calado, dimensões, destino/ETA). Ele NÃO carrega
// "tempo de espera", "carga em toneladas" nem "índice dinâmico" — esses campos
// são ESTIMADOS/CALCULADOS aqui a partir do que o AIS fornece. Os comentários
// marcam o que é medido vs. estimado.

import type { NavioDTO } from "../api/_lib/baseDados";

// Referência (ponto do porto) para estimar distância/ETA. Padrão: Itaqui.
export interface Ref { lat: number; lon: number }
const ITAQUI: Ref = { lat: -2.575, lon: -44.371 };

export interface VesselState {
  mmsi: number;
  nome?: string;
  tipoAis?: number; // código de tipo do AIS (0-99)
  comprimento?: number; // metros (Dimension A+B)
  caladoMax?: number; // metros (MaximumStaticDraught)
  navStatus?: number; // NavigationalStatus
  lat?: number;
  lon?: number;
  sog?: number; // velocidade sobre o solo (nós)
  primeiraVez: number; // epoch ms da primeira observação
  ultimaVez: number; // epoch ms da última observação
}

function haversineNm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3440.065; // raio da Terra em milhas náuticas
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

// Tipo de carga estimado a partir do código de tipo AIS + palavras no nome.
function tipoCarga(v: VesselState): NavioDTO["tipoCarga"] {
  const t = v.tipoAis ?? 0;
  const nome = (v.nome ?? "").toUpperCase();
  if (t >= 80 && t <= 89) return "Combustíveis"; // Tanker
  if (t >= 70 && t <= 79) {
    if (/CONTAIN|MAERSK|MSC|CMA|COSCO|EVERGREEN|HAPAG/.test(nome)) return "Contêineres";
    return "Grãos"; // carga geral; Itaqui é forte em granéis
  }
  return "Multiuso";
}

function bercoCompativel(tipo: NavioDTO["tipoCarga"]): string[] {
  switch (tipo) {
    case "Grãos": return ["B1"];
    case "Contêineres": return ["B2"];
    case "Combustíveis": return ["B3"];
    default: return ["B4"];
  }
}

// Tempo de espera ESTIMADO (horas).
function tempoEsperaEstimado(v: VesselState, agora: number, ref: Ref): number {
  const ancorado = v.navStatus === 1; // 1 = At anchor
  if (ancorado) {
    // Horas desde a primeira observação ancorado.
    return clamp((agora - v.primeiraVez) / 3_600_000, 0, 72);
  }
  // Em movimento: ETA bruta = distância ao porto / velocidade.
  if (v.lat != null && v.lon != null) {
    const dist = haversineNm(v.lat, v.lon, ref.lat, ref.lon);
    const vel = Math.max(v.sog ?? 0, 1);
    return clamp(dist / vel, 0, 72);
  }
  return 0;
}

function prioridade(tempoEspera: number): NavioDTO["prioridade"] {
  if (tempoEspera >= 12) return "Crítica";
  if (tempoEspera >= 8) return "Alta";
  if (tempoEspera >= 4) return "Média";
  return "Baixa";
}

// Índice Dinâmico (nosso algoritmo) — pontua a urgência de atracação 0-100.
function indiceDinamico(tempoEspera: number, prio: NavioDTO["prioridade"]): number {
  const bonusPrio = { Crítica: 30, Alta: 20, Média: 10, Baixa: 0 }[prio];
  return round1(clamp(40 + tempoEspera * 2 + bonusPrio, 0, 100));
}

export function vesselParaNavio(v: VesselState, agora: number, ref: Ref = ITAQUI): NavioDTO {
  const tipo = tipoCarga(v);
  const tempoEspera = round1(tempoEsperaEstimado(v, agora, ref));
  const prio = prioridade(tempoEspera);
  return {
    id: String(v.mmsi),
    nome: v.nome?.trim() || `MMSI ${v.mmsi}`,
    tipoCarga: tipo,
    tempoEspera, // ESTIMADO
    prioridade: prio, // DERIVADO
    bercoCompativel: bercoCompativel(tipo),
    statusClimatico: "Favorável", // AIS não traz clima (ver integração Open-Meteo)
    tamanho: v.comprimento ?? 0, // medido (dimensões AIS)
    cargaToneladas: v.caladoMax ? Math.round(v.caladoMax * 5000) : 0, // ESTIMADO via calado
    chegada: new Date(v.primeiraVez).toISOString(), // primeira observação
    indiceDinamico: indiceDinamico(tempoEspera, prio), // CALCULADO
  };
}

// Converte o conjunto de embarcações observadas em uma fila de navios,
// ordenada por índice dinâmico (maior primeiro).
export function construirFila(
  vessels: Iterable<VesselState>,
  agora: number,
  ref: Ref = ITAQUI
): NavioDTO[] {
  return Array.from(vessels)
    .map((v) => vesselParaNavio(v, agora, ref))
    .sort((a, b) => b.indiceDinamico - a.indiceDinamico);
}
