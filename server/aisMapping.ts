// Mapeamento de mensagens AIS (aisstream.io) para o schema de Navio da aplicação.
//
// IMPORTANTE: o AIS transmite identificação, posição, rumo, velocidade e alguns
// dados estáticos (nome, tipo, calado, dimensões, destino/ETA). Ele NÃO carrega
// "tempo de espera", "carga em toneladas" nem "índice dinâmico" — esses campos
// são ESTIMADOS/CALCULADOS aqui a partir do que o AIS fornece. Os comentários
// marcam o que é medido vs. estimado.

import type { NavioDTO } from "../api/_lib/baseDados";
import { calcularIDA } from "../api/_lib/ida";

// Referência (ponto do porto) para estimar distância/ETA. Padrão: Itaqui.
export interface Ref { lat: number; lon: number }
const ITAQUI: Ref = { lat: -2.575, lon: -44.371 };

type TipoCarga = NavioDTO["tipoCarga"];
type Prioridade = NavioDTO["prioridade"];
const TIPOS: TipoCarga[] = ["Grãos", "Contêineres", "Combustíveis", "Multiuso"];
const RANK: Record<Prioridade, number> = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };
// Berços compatíveis (mesmo modelo da simulação: B4 flexível/transbordo).
const COMPAT: Record<TipoCarga, string[]> = {
  Grãos: ["B1", "B4"], Contêineres: ["B2", "B4"], Combustíveis: ["B3", "B4"], Multiuso: ["B4", "B1", "B2"],
};
// Faixas plausíveis por tipo, usadas quando o AIS não traz dimensões/calado.
const FAIXA: Record<TipoCarga, { tam: [number, number]; carga: [number, number] }> = {
  Grãos: { tam: [220, 245], carga: [40000, 55000] },
  Contêineres: { tam: [270, 300], carga: [35000, 45000] },
  Combustíveis: { tam: [185, 205], carga: [48000, 60000] },
  Multiuso: { tam: [180, 215], carga: [20000, 30000] },
};

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

// Número pseudo-aleatório porém ESTÁVEL por navio (a partir do MMSI + salt).
// Permite "preencher" atributos que o AIS não transmite, de forma consistente
// (o mesmo navio recebe sempre os mesmos valores) e variada entre a frota.
function frac(mmsi: number, salt: number): number {
  let h = (mmsi ^ (salt * 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 13;
  return ((h >>> 0) % 100000) / 100000;
}
const faixaVal = (mmsi: number, salt: number, [a, b]: [number, number]) =>
  a + frac(mmsi, salt) * (b - a);

// Tipo de carga: usa o tipo/nome do AIS quando disponível; senão, deriva um
// tipo estável a partir do MMSI (mantém variedade na frota).
function tipoCarga(v: VesselState): TipoCarga {
  const t = v.tipoAis ?? 0;
  const nome = (v.nome ?? "").toUpperCase();
  if (/CONTAIN|MAERSK|MSC|CMA|COSCO|EVERGREEN|HAPAG|CONTSHIP/.test(nome)) return "Contêineres";
  if (/TANKER|GAS|OIL|PETRO|LNG|LPG|CRUDE/.test(nome)) return "Combustíveis";
  if (/BULK|GRAIN|ORE|SOY|CEREAL/.test(nome)) return "Grãos";
  if (t >= 80 && t <= 89) return "Combustíveis"; // Tanker
  if (t >= 70 && t <= 79) return "Grãos"; // Cargo (Itaqui é forte em granéis)
  if (t >= 60 && t <= 69) return "Multiuso"; // Passenger/Other
  // Sem dado estático utilizável → atribui um tipo estável pelo MMSI.
  return TIPOS[Math.floor(frac(v.mmsi, 1) * TIPOS.length)];
}

// Prioridade DERIVADA: combina uma prioridade atribuída por MMSI (legal/contratual,
// que o AIS não informa) com a urgência por tempo de espera — vale a mais urgente.
function prioridadePorMmsi(mmsi: number): Prioridade {
  const r = frac(mmsi, 7);
  return r < 0.1 ? "Crítica" : r < 0.35 ? "Alta" : r < 0.75 ? "Média" : "Baixa";
}
function prioridadePorEspera(tempoEspera: number): Prioridade {
  if (tempoEspera >= 12) return "Crítica";
  if (tempoEspera >= 8) return "Alta";
  if (tempoEspera >= 4) return "Média";
  return "Baixa";
}
function prioridade(mmsi: number, tempoEspera: number): Prioridade {
  const a = prioridadePorMmsi(mmsi);
  const b = prioridadePorEspera(tempoEspera);
  return RANK[a] <= RANK[b] ? a : b; // a mais urgente (menor rank)
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

export function vesselParaNavio(v: VesselState, agora: number, ref: Ref = ITAQUI): NavioDTO {
  const tipo = tipoCarga(v);
  const tempoEspera = round1(tempoEsperaEstimado(v, agora, ref));
  const fx = FAIXA[tipo];
  const navio: NavioDTO = {
    id: String(v.mmsi),
    nome: v.nome?.trim() || `MMSI ${v.mmsi}`,
    tipoCarga: tipo, // medido (AIS) ou derivado do MMSI
    tempoEspera, // ESTIMADO (ancoragem/ETA)
    prioridade: prioridade(v.mmsi, tempoEspera), // DERIVADO (atribuído + espera)
    bercoCompativel: COMPAT[tipo],
    statusClimatico: "Favorável", // recalculado com o clima real no coletor
    // tamanho/carga: usa o dado real do AIS quando há; senão, estimativa por tipo.
    tamanho: v.comprimento && v.comprimento > 0 ? v.comprimento : Math.round(faixaVal(v.mmsi, 2, fx.tam)),
    cargaToneladas: v.caladoMax && v.caladoMax > 0
      ? Math.round(v.caladoMax * 4500)
      : Math.round(faixaVal(v.mmsi, 3, fx.carga) / 100) * 100,
    chegada: new Date(v.primeiraVez).toISOString(),
    indiceDinamico: 0,
  };
  navio.indiceDinamico = calcularIDA(navio); // IDA multicritério (clima finalizado no coletor)
  return navio;
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
